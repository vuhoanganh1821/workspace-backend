import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserDocument } from 'src/modules/users/entities/user.entity';

export type TaskCommentDocument = HydratedDocument<TaskComment>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class TaskComment {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true, index: true })
  taskId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop()
  message: string;
}

export const TaskCommentSchema = SchemaFactory.createForClass(TaskComment);

TaskCommentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

export type TaskCommentWithRelations = TaskComment & {
  user?: Partial<UserDocument>;
};
