import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { EProjectHealth, ESprintStatus, ETaskStatus } from 'src/enums';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { Project, ProjectDocument } from '../projects/entities/project.entity';
import { Sprint, SprintDocument } from '../sprints/entities/sprint.entity';
import { Task, TaskDocument } from '../tasks/entities/task.entity';
import { ProjectOverviewDto } from './dto/project-overview.dto';
import { getProjectOverviewPipeline } from './pipelines/get-project-overview.pipeline';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<TaskDocument>,

    @InjectModel(Sprint.name)
    private sprintModel: Model<SprintDocument>,

    @InjectModel(Project.name)
    private projectModel: Model<ProjectDocument>,

    @InjectModel(ProjectMember.name)
    private readonly projectMemberModel: Model<ProjectMember>,
  ) {}

  async getUserDashboard(currentUserId: string, currentProjectId: string) {
    const userId = new Types.ObjectId(currentUserId);
    const projectId =
      currentProjectId !== 'all' ? new Types.ObjectId(currentProjectId) : null;

    const memberQuery: QueryFilter<ProjectMember> = {
      userId: userId,
      ...(projectId && { projectId }),
    };

    const userProjectIds = await this.projectMemberModel
      .find(memberQuery)
      .distinct('projectId');

    if (userProjectIds?.length === 0) {
      return this.getEmptyUserDashboard();
    }

    const pipeline = getProjectOverviewPipeline(userId, userProjectIds);

    const activeProjectIds = await this.projectModel
      .find({ _id: { $in: userProjectIds }, isActive: true })
      .distinct('_id');

    const activeSprintIds = await this.sprintModel
      .find({
        projectId: { $in: activeProjectIds },
        status: ESprintStatus.ACTIVE,
      })
      .distinct('_id');

    const now = new Date();
    const taskBaseQuery = {
      assigneeId: userId,
      sprintId: { $in: activeSprintIds },
      projectId: { $in: activeProjectIds },
    };

    const [projectOverviews, allTasks, overdueTasks, inProgressTasks] =
      await Promise.all([
        this.projectModel.aggregate(pipeline),
        this.taskModel.find(taskBaseQuery).lean(),
        this.taskModel
          .find({
            ...taskBaseQuery,
            dueDate: { $lt: now },
            status: { $ne: ETaskStatus.DONE },
          })
          .lean(),
        this.taskModel
          .find({
            ...taskBaseQuery,
            status: ETaskStatus.IN_PROGRESS,
          })
          .lean(),
      ]);

    const totalProjects = activeProjectIds?.length;
    const totalTasks = allTasks?.length;
    const totalOverdue = overdueTasks?.length;
    const totalCompleted = allTasks.filter(
      (task) => task?.status === ETaskStatus.DONE,
    )?.length;

    return {
      totalProjects,
      totalTasks,
      totalOverdue,
      totalCompleted,
      projectOverviews,
      allTasks,
      overdueTasks,
      inProgressTasks,
    };
  }

  private getEmptyUserDashboard() {
    return {
      totalProjects: 0,
      totalTasks: 0,
      totalOverdue: 0,
      totalCompleted: 0,
      projectOverviews: [],
      allTasks: [],
      overdueTasks: [],
      inProgressTasks: [],
    };
  }

  async getAdminDashboard(): Promise<ProjectOverviewDto[]> {
    const now = new Date();

    const activeSprints = await this.sprintModel
      .find({ status: ESprintStatus.ACTIVE })
      .populate<{
        projectId: Pick<ProjectDocument, '_id' | 'name' | 'logo'>;
      }>('projectId', 'name logo')
      .lean()
      .exec();

    const dashboardData = await Promise.all(
      activeSprints.map(async (sprint) => {
        const project = sprint?.projectId;
        // if (!project) return null;

        const [totalTasks, doneTasks, overdueTasks] = await Promise.all([
          this.taskModel.countDocuments({ sprintId: sprint?._id }),
          this.taskModel.countDocuments({
            sprintId: sprint?._id,
            status: ETaskStatus.DONE,
          }),
          this.taskModel.countDocuments({
            sprintId: sprint?._id,
            status: { $ne: ETaskStatus.DONE },
            dueDate: { $lt: now },
          }),
        ]);

        // Tính % tiến độ (nếu không có task nào thì mặc định là 0%)
        const progress =
          totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

        // Gọi hàm tính toán sức khỏe dự án
        const healthStatus = this.calculateProjectHealth(
          totalTasks,
          doneTasks,
          overdueTasks,
          sprint?.startDate,
          sprint?.endDate,
        );

        return {
          _id: project?._id?.toString(),
          name: project?.name,
          logo: project?.logo,
          activeSprint: {
            _id: sprint?._id,
            name: sprint?.name,
            startDate: sprint?.startDate,
            endDate: sprint?.endDate,
          },
          progress,
          healthStatus,
        };
      }),
    );

    return dashboardData;
  }

  private calculateProjectHealth(
    totalTasks: number,
    doneTasks: number,
    overdueTasks: number,
    startDate?: Date,
    endDate?: Date,
  ): string {
    // Nếu chưa có task hoặc thiếu dữ liệu ngày tháng của Sprint -> Mặc định an toàn là ON_TRACK
    if (!totalTasks || totalTasks === 0 || !startDate || !endDate) {
      return EProjectHealth.ON_TRACK;
    }

    const progress = (doneTasks / totalTasks) * 100;
    const overdueRate = (overdueTasks / totalTasks) * 100;

    // Tính toán tỷ lệ thời gian đã trôi qua bằng cấu trúc ép kiểu an toàn gốc getTime()
    const totalSprintTime = endDate?.getTime() - startDate?.getTime();
    const elapsedTime = new Date().getTime() - startDate?.getTime();

    const timeElapsedRate =
      totalSprintTime > 0
        ? Math.min(Math.max((elapsedTime / totalSprintTime) * 100, 0), 100)
        : 0;

    // Độ lệch giữa thời gian tiêu tốn và lượng việc hoàn thành
    const gap = timeElapsedRate - progress;

    // Phân cấp bộ luật Agile kiểm tra điều kiện kích hoạt
    if (overdueRate > 30 || gap > 25) {
      return EProjectHealth.CRITICAL;
    }

    if (overdueRate >= 10 || gap > 10) {
      return EProjectHealth.AT_RISK;
    }

    return EProjectHealth.ON_TRACK;
  }
}
