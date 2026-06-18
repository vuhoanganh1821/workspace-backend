import { Types } from 'mongoose';

export interface ISprintProgress {
  statusOverview: { status: string; count: number }[];
  priorityBreakdown: { priority: string; count: number }[];
  typesOfWork: { type: string; count: number }[];
  teamWorkload: {
    assigneeId: Types.ObjectId | null;
    fullName: string;
    count: number;
  }[];
}

export const createSprintProgressPipeline = (
  sprintId: Types.ObjectId,
): any[] => {
  return [
    // 1. Lọc ra toàn bộ Task thuộc Sprint đang active
    {
      $match: {
        sprintId: sprintId,
      },
    },
    // 2. Sử dụng $facet để phân tích thành 4 luồng dữ liệu độc lập cho 4 Card UI
    {
      $facet: {
        // Card 1: Status Overview (Biểu đồ tròn)
        statusOverview: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              status: '$_id',
              count: 1,
            },
          },
        ],

        // Card 2: Priority Breakdown (Biểu đồ cột dọc)
        priorityBreakdown: [
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              priority: '$_id',
              count: 1,
            },
          },
        ],

        // Card 3: Types of Work (Biểu đồ cột ngang - Tỷ lệ phần trăm)
        typesOfWork: [
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              type: '$_id',
              count: 1,
            },
          },
        ],

        // Card 4: Team Workload (Biểu đồ cột ngang theo Assignee)
        teamWorkload: [
          {
            $lookup: {
              from: 'users', // Hãy chắc chắn tên collection trong DB của bạn là 'users'
              localField: 'assigneeId',
              foreignField: '_id',
              as: 'assigneeInfo',
            },
          },
          {
            $unwind: {
              path: '$assigneeInfo',
              preserveNullAndEmptyArrays: true, // Giữ lại task nếu chưa gán cho ai (Unassigned)
            },
          },
          {
            $group: {
              _id: {
                id: '$assigneeId',
                fullName: { $ifNull: ['$assigneeInfo.fullName', 'Unassigned'] },
              },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              assigneeId: '$_id.id',
              fullName: '$_id.fullName',
              count: 1,
            },
          },
        ],
      },
    },
  ];
};
