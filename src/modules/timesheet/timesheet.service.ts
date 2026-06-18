import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTimesheetDto } from './dto/create-timesheet.dto';
import { FilterTimesheetDto } from './dto/filter-timesheet.dto';
import { UpdateTimesheetDto } from './dto/update-timesheet.dto';
import { Timesheet, TimesheetDocument } from './entities/timesheet.entity';

@Injectable()
export class TimesheetService {
  constructor(
    @InjectModel(Timesheet.name)
    private timesheetModel: Model<TimesheetDocument>,
  ) {}

  async create(createTimesheetDto: CreateTimesheetDto) {
    const { startTime, endTime, userId } = createTimesheetDto;

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
    const isOverlapping = await this.timesheetModel.findOne({
      userId: userId,
      $and: [{ startTime: { $lt: end } }, { endTime: { $gt: start } }],
    });

    if (isOverlapping) {
      throw new ConflictException('Time overlap detected.');
    }

    const newTimesheet = new this.timesheetModel({
      ...createTimesheetDto,
      userId: new Types.ObjectId(userId),
      projectId: new Types.ObjectId(createTimesheetDto.projectId),
      taskId: new Types.ObjectId(createTimesheetDto.taskId),
      startTime: start,
      endTime: end,
    });

    return await newTimesheet.save();
  }

  async findAll(filterDto?: FilterTimesheetDto) {
    if (filterDto) {
      const { projectId, taskId, startTime, endTime } = filterDto;
      let filter = {};
      if (projectId) {
        filter = { ...filter, projectId: new Types.ObjectId(projectId) };
      }
      if (taskId) {
        filter = { ...filter, taskId: new Types.ObjectId(taskId) };
      }
      if (startTime && endTime) {
        filter = {
          ...filter,
          startTime: { $gte: new Date(startTime) },
          endTime: { $lte: new Date(endTime) },
        };
      }
      const timesheets = await this.timesheetModel
        .find(filter)
        .sort({ startTime: -1 })
        .exec();
      return timesheets;
    }
    const timesheets = await this.timesheetModel
      .find()
      .sort({ startTime: -1 })
      .exec();
    return timesheets;
  }

  findOne(id: string) {
    return `This action returns a #${id} timesheet`;
  }

  async update(id: string, updateTimesheetDto: UpdateTimesheetDto) {
    const { startTime, endTime } = updateTimesheetDto;
    const existingRecord = await this.timesheetModel.findById(id);

    if (!existingRecord) {
      throw new NotFoundException(`Timesheet with ID ${id} not found.`);
    }

    const start = startTime ? new Date(startTime) : existingRecord.startTime;
    const end = endTime ? new Date(endTime) : existingRecord.endTime;
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

    const isOverlapping = await this.timesheetModel.findOne({
      _id: { $ne: id },
      userId: existingRecord.userId,
      $and: [{ startTime: { $lt: end } }, { endTime: { $gt: start } }],
    });

    if (isOverlapping) {
      throw new ConflictException('Time overlap detected with another entry.');
    }

    const updatedTimesheet = await this.timesheetModel.findByIdAndUpdate(
      id,
      {
        ...updateTimesheetDto,
        startTime: start,
        endTime: end,
      },
      { returnDocument: 'after' },
    );

    return updatedTimesheet;
  }

  async remove(id: string) {
    const deletedTimesheet = await this.timesheetModel.findByIdAndDelete(id);

    if (!deletedTimesheet) {
      throw new NotFoundException(`Timesheet not found.`);
    }

    return {
      message: 'Timesheet deleted successfully',
    };
  }
}
