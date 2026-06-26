import dayjs from 'dayjs';
import { PipelineStage, Types } from 'mongoose';
import { ETaskStatus } from 'src/enums';
import { GetPerformanceQueryDto } from '../dto/get-user-performance.dto';

export interface IAggregationResult {
  tasksData: {
    _id: string;
    title: string;
    projectId: string;
    dueDate: Date;
    completionDate: Date;
    reopenCount: number;
    status: string;
    estimatedHours: number;
    loggedHours: number;
  }[];
  statusOverviewData: {
    _id: ETaskStatus;
    count: number;
  }[];
  projectTimelineData: {
    _id: string;
    name: string;
    totalLoggedHours: number;
  }[];
}

interface IPerformanceMatchStage {
  assigneeId: Types.ObjectId;
  projectId?: Types.ObjectId;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export const getUserPerformancePipeline = (
  userId: string,
  query: GetPerformanceQueryDto,
): PipelineStage[] => {
  const matchStage: IPerformanceMatchStage = {
    assigneeId: new Types.ObjectId(userId),
  };

  if (query?.projectId && query?.projectId !== 'all') {
    matchStage.projectId = new Types.ObjectId(query.projectId);
  }

  if (query?.startDate || query?.endDate) {
    const dateFilter: { $gte?: Date; $lte?: Date } = {};

    if (query?.startDate) {
      dateFilter.$gte = dayjs(query.startDate).startOf('day').toDate();
    }
    if (query?.endDate) {
      dateFilter.$lte = dayjs(query.endDate).endOf('day').toDate();
    }

    matchStage.createdAt = dateFilter;
  }

  return [
    { $match: matchStage },
    {
      $lookup: {
        from: 'timelogs',
        localField: '_id',
        foreignField: 'taskId',
        as: 'timelogs',
      },
    },
    {
      $addFields: {
        loggedHours: {
          $round: [{ $sum: '$timelogs.duration' }, 2],
        },
      },
    },
    {
      $lookup: {
        from: 'projects',
        localField: 'projectId',
        foreignField: '_id',
        as: 'projectInfo',
      },
    },
    {
      $unwind: {
        path: '$projectInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $facet: {
        tasksData: [
          {
            $project: {
              _id: 1,
              title: 1,
              projectId: 1,
              dueDate: 1,
              completionDate: 1,
              reopenCount: 1,
              status: 1,
              estimatedHours: 1,
              loggedHours: 1,
            },
          },
        ],
        statusOverviewData: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ],
        projectTimelineData: [
          {
            $group: {
              _id: '$projectId',
              name: { $first: '$projectInfo.name' },
              totalLoggedHours: { $sum: '$loggedHours' },
            },
          },
        ],
      },
    },
  ];
};
