import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { CreateTimeLogDto } from './dto/create-time-log.dto';
import { FilterTimeLogDto } from './dto/filter-time-log.dto';
import { UpdateTimeLogDto } from './dto/update-time-log.dto';
import { TimeLog, TimeLogDocument } from './entities/time-log.entity';

@Injectable()
export class TimeLogsService {
  constructor(
    @InjectModel(TimeLog.name) private timeLogModel: Model<TimeLogDocument>,
  ) {}

  async create(createTimeLogDto: CreateTimeLogDto) {
    const { startTime, endTime, taskId, userId, projectId } = createTimeLogDto;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start >= end) {
      throw new BadRequestException(
        'Start time must be earlier than end time.',
      );
    }

    if (end > now) {
      throw new BadRequestException(
        'Logging time in the future is not allowed.',
      );
    }

    // (ExistingStart < NewEnd) AND (ExistingEnd > NewStart)
    const isOverlapping = await this.timeLogModel.findOne({
      userId: new Types.ObjectId(userId),
      $and: [{ startTime: { $lt: end } }, { endTime: { $gt: start } }],
    });

    if (isOverlapping) {
      throw new BadRequestException('Time overlap detected.');
    }

    const newTimeLog = new this.timeLogModel({
      ...createTimeLogDto,
      taskId: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
      projectId: new Types.ObjectId(projectId),
      startTime: start,
      endTime: end,
    });

    return newTimeLog.save();
  }

  findAll(filterDto: FilterTimeLogDto) {
    const { taskId } = filterDto;

    const timeLogQuery: QueryFilter<TimeLogDocument> = {
      ...(taskId && { taskId: new Types.ObjectId(taskId) }),
    };

    return this.timeLogModel.find(timeLogQuery).sort({ startTime: -1 }).exec();
  }

  findOne(id: string) {
    return this.timeLogModel.findById(id);
  }

  async update(id: string, updateTimeLogDto: UpdateTimeLogDto) {
    const { startTime, endTime, taskId, userId, projectId } = updateTimeLogDto;

    const foundTimeLog = await this.timeLogModel.findById(id);
    if (!foundTimeLog) {
      throw new NotFoundException(`Timesheet with ID ${id} not found.`);
    }

    const start = startTime ? new Date(startTime) : foundTimeLog?.startTime;
    const end = endTime ? new Date(endTime) : foundTimeLog?.endTime;
    const now = new Date();

    if (start >= end) {
      throw new BadRequestException(
        'Start time must be earlier than end time.',
      );
    }

    if (end > now) {
      throw new BadRequestException(
        'Logging time in the future is not allowed.',
      );
    }

    const isOverlapping = await this.timeLogModel.findOne({
      _id: { $ne: id },
      userId: new Types.ObjectId(userId),
      $and: [{ startTime: { $lt: end } }, { endTime: { $gt: start } }],
    });

    if (isOverlapping) {
      throw new ConflictException('Time overlap detected with another entry.');
    }

    const updatedTimesheet = await this.timeLogModel.findByIdAndUpdate(
      id,
      {
        ...updateTimeLogDto,
        taskId: new Types.ObjectId(taskId),
        userId: new Types.ObjectId(userId),
        projectId: new Types.ObjectId(projectId),
        startTime: start,
        endTime: end,
      },
      { returnDocument: 'after' },
    );

    return updatedTimesheet;
  }

  async remove(id: string) {
    const deletedTimeLog = await this.timeLogModel.findByIdAndDelete(id);

    if (!deletedTimeLog) {
      throw new NotFoundException(`Time log not found.`);
    }

    return {
      message: 'Time log deleted successfully',
    };
  }
}
