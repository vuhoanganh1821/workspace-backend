import { Types, PipelineStage } from 'mongoose';

export const getProjectOverviewPipeline = (
  userId: Types.ObjectId,
  userProjectIds: Types.ObjectId[],
): PipelineStage[] => {
  return [
    // Stage 1: Lọc các project user tham gia và đang ACTIVE
    {
      $match: {
        _id: { $in: userProjectIds },
        isActive: true,
      },
    },

    // Stage 2: Lookup Active Sprint của Project
    {
      $lookup: {
        from: 'sprints',
        let: { pId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$projectId', '$$pId'] },
              status: 'ACTIVE',
            },
          },
          { $limit: 1 },
        ],
        as: 'activeSprint',
      },
    },
    { $unwind: { path: '$activeSprint', preserveNullAndEmptyArrays: true } },

    // Stage 3: Lookup tổng số lượng Member trong Project
    {
      $lookup: {
        from: 'projectmembers',
        localField: '_id',
        foreignField: 'projectId',
        as: 'members',
      },
    },

    // Stage 4: Lookup Tasks CỦA USER trong Active Sprint để tính Progress
    {
      $lookup: {
        from: 'tasks',
        let: { sprintId: '$activeSprint._id', pId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$projectId', '$$pId'] },
                  { $eq: ['$sprintId', '$$sprintId'] },
                  { $eq: ['$assigneeId', userId] },
                ],
              },
            },
          },
        ],
        as: 'mySprintTasks',
      },
    },

    // Stage 5: Tính toán các thông số số lượng
    {
      $addFields: {
        totalMember: { $size: '$members' },
        myTotalTasks: { $size: '$mySprintTasks' },
        myDoneTasks: {
          $size: {
            $filter: {
              input: '$mySprintTasks',
              as: 'task',
              cond: { $eq: ['$$task.status', 'DONE'] },
            },
          },
        },
      },
    },

    // Stage 6: Format đầu ra match với ProjectOverviewDto
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        sprintName: { $ifNull: ['$activeSprint.name', 'No Active Sprint'] },
        sprintEndDate: { $ifNull: ['$activeSprint.endDate', null] },
        totalMember: 1,
        progressPercentage: {
          $cond: [
            { $eq: ['$myTotalTasks', 0] },
            0,
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$myDoneTasks', '$myTotalTasks'] },
                    100,
                  ],
                },
                2,
              ],
            },
          ],
        },
      },
    },
  ];
};
