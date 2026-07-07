import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import dayjs from 'dayjs';
import { Model, Types } from 'mongoose';
import { ESprintStatus, ETaskStatus, ETaskStatusOrder } from 'src/enums';
import {
  Sprint,
  SprintDocument,
} from 'src/modules/sprints/entities/sprint.entity';
import {
  TaskComment,
  TaskCommentDocument,
} from '../task-comment/entities/task-comment.entity';
import { TaskHistoryChange } from '../task-history/entities/task-history-change.entity';
import {
  TaskHistory,
  TaskHistoryDocument,
} from '../task-history/entities/task-history.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskDocument, TaskWithRelations } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(TaskHistory.name)
    private taskHistoryModel: Model<TaskHistoryDocument>,
    @InjectModel(TaskComment.name)
    private taskCommentModel: Model<TaskCommentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Sprint.name) private sprintModel: Model<SprintDocument>,
  ) {}

  create(createTaskDto: CreateTaskDto) {
    const { projectId, createdBy, assigneeId, sprintId } = createTaskDto;

    const newTask = new this.taskModel({
      ...createTaskDto,
      projectId: new Types.ObjectId(projectId),
      createdBy: new Types.ObjectId(createdBy),
      assigneeId: new Types.ObjectId(assigneeId),
      sprintId: sprintId ? new Types.ObjectId(sprintId) : null,
    });

    return newTask.save();
  }

  async findTasksByProject(projectId: string): Promise<Task[]> {
    return this.taskModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .populate('assignee', 'fullName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findTasksBySprint(filterDto: FilterTaskDto) {
    const { sprintId, search } = filterDto;

    if (!sprintId) {
      return { backlogTasks: [], sprintTasks: [] };
    }

    const foundSprint = await this.sprintModel.findById(sprintId).exec();

    const backlogTasks = await this.taskModel
      .find({
        $or: [
          { sprintId: { $exists: false } },
          { sprintId: null },
          { sprintId: '' },
        ],
        projectId: new Types.ObjectId(foundSprint?.projectId),
        ...(search && { title: { $regex: search, $options: 'i' } }),
      })
      .populate('assignee', 'fullName email avatar')
      .sort({ createdAt: -1 })
      .exec();

    const sprintTasks = await this.taskModel
      .find({
        sprintId: new Types.ObjectId(sprintId),
        projectId: new Types.ObjectId(foundSprint?.projectId),
        ...(search && { title: { $regex: search, $options: 'i' } }),
      })
      .populate('assignee', 'fullName email avatar')
      .sort({ createdAt: -1 })
      .exec();

    return { backlogTasks, sprintTasks };
  }

  async findTasksByUser(userId: string): Promise<Task[]> {
    return this.taskModel
      .find({
        assigneeId: new Types.ObjectId(userId),
        status: { $ne: 'CANCELLED' },
      })
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<void> {
    const { projectId, createdBy, assigneeId, sprintId, ...rest } =
      updateTaskDto;

    const foundTask: TaskWithRelations | null = await this.taskModel
      .findById(id)
      .populate([
        {
          path: 'sprint',
          select: '_id status',
        },
        {
          path: 'assignee',
          select: '_id fullName avatar',
        },
      ])
      .lean()
      .exec();

    if (!foundTask) {
      throw new NotFoundException(`Task with ID "${id}" not found.`);
    }

    if (foundTask?.sprint?.status === ESprintStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot modify tasks in a completed sprint.',
      );
    }

    const promises: Promise<unknown>[] = [];

    const changes = await this.getTaskChanges(foundTask, updateTaskDto);

    if (changes?.length > 0) {
      promises.push(
        this.taskHistoryModel.create({
          taskId: new Types.ObjectId(id),
          userId: new Types.ObjectId(userId),
          changes,
        }),
      );
    }

    const updateQuery = {
      ...rest,
      ...(foundTask?.status !== ETaskStatus.DONE &&
        updateTaskDto?.status === ETaskStatus.DONE && {
          completionDate: new Date(),
        }),
      ...(updateTaskDto?.status &&
        this.checkTaskReopened(foundTask?.status, updateTaskDto?.status) && {
          reopenCount: (foundTask?.reopenCount ?? 0) + 1,
        }),
      ...(sprintId && { sprintId: new Types.ObjectId(sprintId) }),
      ...(projectId && { projectId: new Types.ObjectId(projectId) }),
      ...(createdBy && { createdBy: new Types.ObjectId(createdBy) }),
      ...(assigneeId && { assigneeId: new Types.ObjectId(assigneeId) }),
    };

    promises.push(this.taskModel.findByIdAndUpdate(id, updateQuery).exec());

    await Promise.all(promises);
  }

  async moveTask(
    id: string,
    moveTaskDto: MoveTaskDto,
    userId: string,
  ): Promise<void> {
    const { sprintId } = moveTaskDto;

    let foundSprint: SprintDocument | null = null;

    if (sprintId) {
      foundSprint = await this.sprintModel
        .findOne({
          _id: new Types.ObjectId(sprintId ?? ''),
        })
        .lean()
        .exec();
    }

    const foundTask: TaskWithRelations | null = await this.taskModel
      .findOne({
        _id: new Types.ObjectId(id),
      })
      .populate('sprint')
      .lean()
      .exec();

    if (foundSprint?.status === ESprintStatus.COMPLETED) {
      throw new BadRequestException('Cannot move task to completed sprint.');
    }

    if (foundTask?.sprint?.status === ESprintStatus.COMPLETED) {
      throw new BadRequestException('Cannot move task from completed sprint.');
    }

    const oldTask: TaskWithRelations | null = await this.taskModel
      .findByIdAndUpdate(
        id,
        {
          sprintId: sprintId ? new Types.ObjectId(sprintId) : null,
        },
        { returnDocument: 'before' },
      )
      .populate('sprint')
      .exec();

    if (!oldTask) {
      throw new NotFoundException(`Không tìm thấy Task với ID ${id}`);
    }

    const oldSprintName = oldTask?.sprintId ? oldTask?.sprint?.name : 'Backlog';
    const newSprintName = foundSprint ? foundSprint?.name : 'Backlog';

    const changes = [
      {
        field: 'sprint',
        oldValue: oldSprintName,
        newValue: newSprintName,
      },
    ];

    await this.taskHistoryModel.create({
      taskId: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
      changes,
    });
  }

  async remove(id: string) {
    const result = await this.taskModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Task with ID "${id}" not found.`);
    }
    return { message: 'Task deleted successfully' };
  }

  findAll() {
    return `This action returns all tasks`;
  }

  findOne(id: string) {
    return this.taskModel.findById(id).populate('assignee').exec();
  }

  getHistories(taskId: string) {
    return this.taskHistoryModel
      .find({ taskId: new Types.ObjectId(taskId) })
      .populate('user', '_id fullName avatar')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  getComments(taskId: string) {
    return this.taskCommentModel
      .find({ taskId: new Types.ObjectId(taskId) })
      .populate('user', '_id fullName avatar')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async getTaskChanges(foundTask: TaskWithRelations, updateDto: UpdateTaskDto) {
    const changes: TaskHistoryChange[] = [];

    if (
      updateDto?.assigneeId &&
      updateDto?.assigneeId !== foundTask?.assigneeId?.toString()
    ) {
      const newAssignee = await this.userModel
        .findById(updateDto?.assigneeId)
        .select('_id fullName')
        .lean()
        .exec();
      changes.push({
        field: 'assignee',
        oldValue: foundTask?.assignee?.fullName ?? '',
        newValue: newAssignee?.fullName ?? '',
      });
    }

    if (updateDto?.status && updateDto?.status !== foundTask?.status) {
      changes.push({
        field: 'status',
        oldValue: foundTask?.status,
        newValue: updateDto?.status,
      });
    }

    if (updateDto?.title && updateDto?.title !== foundTask?.title) {
      changes.push({
        field: 'title',
        oldValue: foundTask?.title,
        newValue: updateDto?.title,
      });
    }

    if (
      updateDto?.description &&
      updateDto?.description !== foundTask?.description
    ) {
      changes.push({
        field: 'description',
        oldValue: foundTask?.description,
        newValue: updateDto?.description,
      });
    }

    if (updateDto?.priority && updateDto?.priority !== foundTask?.priority) {
      changes.push({
        field: 'priority',
        oldValue: foundTask?.priority,
        newValue: updateDto?.priority,
      });
    }

    if (updateDto?.type && updateDto?.type !== foundTask?.type) {
      changes.push({
        field: 'type',
        oldValue: foundTask?.type,
        newValue: updateDto?.type,
      });
    }

    if (
      updateDto?.estimatedHours &&
      updateDto?.estimatedHours !== foundTask?.estimatedHours
    ) {
      changes.push({
        field: 'estimatedHours',
        oldValue: `${foundTask?.estimatedHours}h`,
        newValue: `${updateDto?.estimatedHours}h`,
      });
    }

    if (
      updateDto?.startDate &&
      !dayjs(updateDto?.startDate).isSame(foundTask?.startDate, 'day')
    ) {
      changes.push({
        field: 'startDate',
        oldValue: dayjs(foundTask?.startDate).format('MMMM D, YYYY'),
        newValue: dayjs(updateDto?.startDate).format('MMMM D, YYYY'),
      });
    }

    if (
      updateDto?.dueDate &&
      !dayjs(updateDto?.dueDate).isSame(foundTask?.dueDate, 'day')
    ) {
      changes.push({
        field: 'dueDate',
        oldValue: dayjs(foundTask?.dueDate).format('MMMM D, YYYY'),
        newValue: dayjs(updateDto?.dueDate).format('MMMM D, YYYY'),
      });
    }

    return changes;
  }

  checkTaskReopened(oldStatus: ETaskStatus, newStatus: ETaskStatus): boolean {
    const completedStatuses = [
      ETaskStatus.CODING_DONE,
      ETaskStatus.TESTING,
      ETaskStatus.DONE,
    ];

    if (!completedStatuses?.includes(oldStatus)) {
      return false;
    }

    return newStatus === ETaskStatus.IN_PROGRESS;
  }
}
