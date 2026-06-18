/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ETaskPriority, ETaskStatus, ETaskType } from 'src/enums';
import {
  Task,
  TaskDocument,
  TaskWithRelations,
} from 'src/modules/tasks/entities/task.entity';
import {
  ProjectMember,
  ProjectMemberWithRelations,
} from '../project-members/entities/project-member.entity';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { FilterSprintDto } from './dto/filter-sprint.dto';
import { TeamMemberProgressDto } from './dto/team-member-progress.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import {
  MiniTaskDto,
  TasksByStatus,
  UserDetailProgressDto,
} from './dto/user-detail-progress.dto';
import { Sprint, SprintDocument } from './entities/sprint.entity';
import {
  createSprintProgressPipeline,
  ISprintProgress,
} from './pipelines/sprint.pipeline';
import { createUserDetailProgressPipeline } from './pipelines/user-detail-progress.pipeline';

@Injectable()
export class SprintsService {
  constructor(
    @InjectModel(Sprint.name)
    private sprintModel: Model<SprintDocument>,
    @InjectModel(Task.name)
    private taskModel: Model<TaskDocument>,
    @InjectModel(ProjectMember.name)
    private readonly projectMemberModel: Model<ProjectMember>,
  ) {}

  create(createSprintDto: CreateSprintDto) {
    return this.sprintModel.create({
      ...createSprintDto,
      projectId: new Types.ObjectId(createSprintDto?.projectId),
    });
  }

  findAll(filter?: FilterSprintDto) {
    if (filter) {
      const { projectId } = filter;
      return this.sprintModel
        .find({ projectId: new Types.ObjectId(projectId) })
        .sort({ createdAt: -1 })
        .exec();
    }
    return this.sprintModel.find().sort({ createdAt: -1 }).exec();
  }

  findOne(id: string) {
    return this.sprintModel.findById(id);
  }

  update(id: string, updateSprintDto: UpdateSprintDto) {
    return this.sprintModel.findByIdAndUpdate(
      id,
      {
        ...updateSprintDto,
        projectId: new Types.ObjectId(updateSprintDto?.projectId),
      },
      {
        new: true,
      },
    );
  }

  remove(id: string) {
    return this.sprintModel.findByIdAndDelete(id);
  }

  async getCurrentSprintProgress(sprintId: string) {
    const activeSprint = await this.sprintModel.findOne({
      _id: new Types.ObjectId(sprintId),
    });

    if (!activeSprint) {
      throw new NotFoundException('Không tìm thấy Sprint nào.');
    }

    const pipeline = createSprintProgressPipeline(activeSprint?._id);
    const aggregationResult = await this.taskModel.aggregate(pipeline);

    const progressData: ISprintProgress = aggregationResult[0] ?? {
      statusOverview: [],
      priorityBreakdown: [],
      typesOfWork: [],
      teamWorkload: [],
    };

    const { statusOverview, priorityBreakdown, typesOfWork, teamWorkload } =
      progressData;

    const totalTasks = statusOverview.reduce(
      (sum, item) => sum + item?.count,
      0,
    );

    // STATUS
    const defaultStatuses: string[] = [
      ETaskStatus.TODO,
      ETaskStatus.IN_PROGRESS,
      ETaskStatus.CODING_DONE,
      ETaskStatus.TESTING,
      ETaskStatus.DONE,
    ];
    const fullStatusOverview = defaultStatuses?.map((status) => {
      const found = statusOverview.find((item) => item?.status === status);
      return {
        status,
        count: found ? found?.count : 0,
      };
    });

    // PRIORITY
    const defaultPriorities: string[] = [
      ETaskPriority.LOW,
      ETaskPriority.MEDIUM,
      ETaskPriority.HIGH,
      ETaskPriority.URGENT,
    ];
    const fullPriorityBreakdown = defaultPriorities?.map((priority) => {
      const found = priorityBreakdown.find(
        (item) => item?.priority === priority,
      );
      return {
        priority,
        count: found ? found?.count : 0,
      };
    });

    // TYPE
    const defaultTypes: string[] = [
      ETaskType.TESTING,
      ETaskType.BUG,
      ETaskType.BACKEND,
      ETaskType.FRONTEND,
      ETaskType.DESIGN,
    ];
    const fullTypesOfWork = defaultTypes?.map((type) => {
      const found = typesOfWork.find((item) => item?.type === type);
      const count = found ? found?.count : 0;
      return {
        type,
        count,
        percentage:
          totalTasks > 0
            ? parseFloat(((count / totalTasks) * 100).toFixed(2))
            : 0,
      };
    });

    const fullTeamWorkload = teamWorkload?.map((item) => ({
      ...item,
      percentage:
        totalTasks > 0
          ? parseFloat(((item.count / totalTasks) * 100).toFixed(2))
          : 0,
    }));

    return {
      statusOverview: fullStatusOverview,
      priorityBreakdown: fullPriorityBreakdown,
      typesOfWork: fullTypesOfWork,
      teamWorkload: fullTeamWorkload,
    };
  }

  async getTeamProgress(sprintId: string): Promise<TeamMemberProgressDto[]> {
    if (!Types.ObjectId.isValid(sprintId)) {
      throw new NotFoundException('Invalid Sprint ID format');
    }
    const targetSprintId = new Types.ObjectId(sprintId);

    // 1. Lấy tất cả task trong Sprint hiện tại và điền kèm thông tin User gánh việc
    const allTasks = await this.taskModel
      .find({ sprintId: targetSprintId, assigneeId: { $ne: null } })
      .populate('assignee', 'fullName avatar')
      .lean();

    if (!allTasks || allTasks.length === 0) {
      return [];
    }

    // 2. Lấy projectId của dự án (Lấy từ task đầu tiên tìm thấy)
    const targetProjectId = allTasks[0].projectId;

    // 3. Lấy danh sách toàn bộ member trong Project để lấy vị trí (position) công việc
    const projectMembers = await this.projectMemberModel
      .find({ projectId: targetProjectId })
      .lean();

    const currentDate = new Date();

    // Đối tượng tạm dùng để gom nhóm các task theo userId
    const memberMap: Record<
      string,
      {
        fullName: string;
        avatar: string;
        totalTasks: number;
        totalDone: number;
        totalOverdue: number;
      }
    > = {};

    // 4. Vòng lặp duyệt qua các task để nhóm và tính toán các chỉ số
    allTasks.forEach((task: TaskWithRelations) => {
      // Ép kiểu assignee về Object do đã được populate phía trên
      const user = task.assignee as unknown as {
        _id: Types.ObjectId;
        fullName: string;
        avatar: string;
      };
      if (!user) return;

      const userIdStr = user._id.toString();

      // Nếu user chưa tồn tại trong map tích lũy thì khởi tạo giá trị ban đầu
      if (!memberMap[userIdStr]) {
        memberMap[userIdStr] = {
          fullName: user.fullName || 'Unknown User',
          avatar: user.avatar || '',
          totalTasks: 0,
          totalDone: 0,
          totalOverdue: 0,
        };
      }

      // Tăng tổng số task của user
      memberMap[userIdStr].totalTasks += 1;

      // Đếm nếu task ở trạng thái hoàn thành
      if (task.status === ETaskStatus.DONE) {
        memberMap[userIdStr].totalDone += 1;
      }

      // Đếm nếu task bị quá hạn (ChưaDONE + Có hạn định + Hạn định bé hơn hiện tại)
      const isNotDone = task.status !== ETaskStatus.DONE;
      const hasDueDate = !!task.dueDate;
      const isPastDue = task.dueDate
        ? new Date(task.dueDate) < currentDate
        : false;

      if (isNotDone && hasDueDate && isPastDue) {
        memberMap[userIdStr].totalOverdue += 1;
      }
    });

    // 5. Chuyển đổi Object map thành mảng DTO kết quả và đính kèm trường position
    const result: TeamMemberProgressDto[] = Object.keys(memberMap).map(
      (userIdStr: string) => {
        const targetMemberData = memberMap[userIdStr];

        // Tìm kiếm position tương ứng của user này trong ProjectMember
        const matchingMember = projectMembers.find(
          (m) => m.userId.toString() === userIdStr,
        );
        const position = matchingMember?.position || 'Member';

        // Tính phần trăm tiến độ công việc (Làm tròn 1 chữ số thập phân)
        const total = targetMemberData.totalTasks;
        const done = targetMemberData.totalDone;
        const progressPercentage =
          total > 0 ? Math.round((done / total) * 100 * 10) / 10 : 0;

        return {
          _id: userIdStr,
          fullName: targetMemberData.fullName,
          avatar: targetMemberData.avatar,
          position: position,
          totalTasks: total,
          totalDone: done,
          totalOverdue: targetMemberData.totalOverdue,
          progressPercentage: progressPercentage,
        };
      },
    );

    // Sắp xếp danh sách theo tiến độ từ thấp đến cao trước khi trả về
    return result.sort((a, b) => a.progressPercentage - b.progressPercentage);
  }

  async getUserDetailProgress(
    sprintId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<UserDetailProgressDto> {
    if (!Types.ObjectId.isValid(sprintId) || !Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid ID format');
    }
    const foundTask = await this.taskModel.findOne({ sprintId }).lean();

    if (!foundTask) {
      throw new NotFoundException('Sprint not found or empty');
    }
    const { projectId } = foundTask;

    const [rawTasks, foundMember] = await Promise.all([
      this.taskModel.aggregate(
        createUserDetailProgressPipeline(sprintId, userId),
      ),
      this.projectMemberModel
        .findOne({ projectId, userId })
        .populate('user', 'fullName avatar')
        .lean() as Promise<ProjectMemberWithRelations | null>,
    ]);

    const userPosition: string = foundMember?.position ?? 'Member';

    const tasksByStatus: TasksByStatus = {
      todo: [],
      inProgress: [],
      codingDone: [],
      testing: [],
      done: [],
    };
    const overdueTasks: MiniTaskDto[] = [];

    if (!rawTasks || rawTasks?.length === 0) {
      return {
        _id: userId.toString(),
        fullName: foundMember?.user?.fullName ?? 'Unknown User',
        avatar: foundMember?.user?.avatar ?? '',
        position: userPosition,
        summary: {
          totalTasks: 0,
          completedTasks: 0,
          progressPercentage: 0,
        },
        tasksByStatus,
        overdueTasks,
      };
    }

    let completedTasks = 0;

    rawTasks.forEach((raw) => {
      const taskItem: MiniTaskDto = {
        _id: raw?._id,
        title: raw?.title,
        priority: raw?.priority,
        dueDate: raw?.dueDate,
        isOverdue: raw?.isOverdue,
      };
      if (raw?.isOverdue) {
        overdueTasks.push(taskItem);
      }
      if (raw?.status === ETaskStatus.DONE) {
        completedTasks++;
      }

      switch (raw?.status) {
        case ETaskStatus.TODO:
          tasksByStatus.todo.push(taskItem);
          break;
        case ETaskStatus.IN_PROGRESS:
          tasksByStatus.inProgress.push(taskItem);
          break;
        case ETaskStatus.CODING_DONE:
          tasksByStatus.codingDone.push(taskItem);
          break;
        case ETaskStatus.TESTING:
          tasksByStatus.testing.push(taskItem);
          break;
        case ETaskStatus.DONE:
          tasksByStatus.done.push(taskItem);
          break;
      }
    });

    const totalTasks = rawTasks?.length;
    const progressPercentage =
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100 * 10) / 10
        : 0;
    const firstItem = rawTasks[0];

    return {
      _id: firstItem?.userId,
      fullName: firstItem?.fullName,
      avatar: firstItem?.avatar,
      position: userPosition,
      summary: { totalTasks, completedTasks, progressPercentage },
      tasksByStatus,
      overdueTasks,
    };
  }
}
