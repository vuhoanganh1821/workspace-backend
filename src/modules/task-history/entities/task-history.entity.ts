import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserDocument } from 'src/modules/users/entities/user.entity';
import {
  TaskHistoryChange,
  TaskHistoryChangeSchema,
} from './task-history-change.entity';

export type TaskHistoryDocument = HydratedDocument<TaskHistory>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class TaskHistory {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true, index: true })
  taskId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [TaskHistoryChangeSchema], required: true })
  changes: TaskHistoryChange[];
}

export const TaskHistorySchema = SchemaFactory.createForClass(TaskHistory);

TaskHistorySchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

export type TaskHistoryWithRelations = TaskHistory & {
  user?: Partial<UserDocument>;
};
