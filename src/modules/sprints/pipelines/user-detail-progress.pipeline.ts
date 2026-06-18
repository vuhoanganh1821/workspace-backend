import { Types } from 'mongoose';

export interface RawAggregateTask {
  _id: Types.ObjectId;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  userId: Types.ObjectId;
  fullName: string;
  avatar: string;
  isOverdue: boolean;
}

export function createUserDetailProgressPipeline(
  sprintId: Types.ObjectId,
  userId: Types.ObjectId,
): any[] {
  const currentDate = new Date();

  return [
    // 1. Match: Lọc đúng task của User trong Sprint này (Cực nhanh nếu có Index)
    {
      $match: {
        sprintId: sprintId,
        assigneeId: userId,
      },
    },
    // 2. Lookup: Lấy thông tin User (Chỉ chạy đúng 1 lần cho user này)
    {
      $lookup: {
        from: 'users',
        localField: 'assigneeId',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    {
      $unwind: '$userDetails',
    },
    // 3. Project: Trả data sạch ra ngoài (Không còn bóng dáng của projectmembers)
    {
      $project: {
        _id: 1,
        title: '$title',
        status: '$status',
        priority: '$priority',
        dueDate: '$dueDate',
        userId: '$userDetails._id',
        fullName: '$userDetails.fullName',
        avatar: '$userDetails.avatar',
        isOverdue: {
          $and: [
            { $ne: ['$status', 'DONE'] },
            { $ifNull: ['$dueDate', false] },
            { $lt: ['$dueDate', currentDate] },
          ],
        },
      },
    },
  ];
}
