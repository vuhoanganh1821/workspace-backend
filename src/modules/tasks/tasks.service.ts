import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ESprintStatus, ETaskStatus, ETaskStatusOrder } from 'src/enums';
import {
  Sprint,
  SprintDocument,
} from 'src/modules/sprints/entities/sprint.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskDocument, TaskWithRelations } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
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

  async findTasksBySprint(sprintId: string) {
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
      })
      .populate('assignee', 'fullName email avatar')
      .sort({ createdAt: -1 })
      .exec();

    const sprintTasks = await this.taskModel
      .find({
        sprintId: new Types.ObjectId(sprintId),
        projectId: new Types.ObjectId(foundSprint?.projectId),
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

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<void> {
    const { projectId, createdBy, assigneeId, sprintId, ...rest } =
      updateTaskDto;

    const foundTask: TaskWithRelations | null = await this.taskModel
      .findById(id)
      .populate('sprint')
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

    await this.taskModel.findByIdAndUpdate(id, updateQuery).exec();
  }

  async moveTask(id: string, moveTaskDto: MoveTaskDto): Promise<Task> {
    const { sprintId } = moveTaskDto;

    const updatedTask = await this.taskModel
      .findByIdAndUpdate(
        id,
        {
          sprintId: sprintId ? new Types.ObjectId(sprintId) : null,
        },
        { returnDocument: 'after' },
      )
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Không tìm thấy Task với ID ${id}`);
    }

    return updatedTask;
  }

  async remove(id: string) {
    const result = await this.taskModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Task with ID "${id}" not found.`);
    }
    return { message: 'Xóa task thành công' };
  }

  findAll() {
    return `This action returns all tasks`;
  }

  findOne(id: string) {
    return this.taskModel.findById(id).populate('assignee').exec();
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

    return ETaskStatusOrder[newStatus] < ETaskStatusOrder[oldStatus];
  }
}
