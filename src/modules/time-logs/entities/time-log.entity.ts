import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { ProjectDocument } from 'src/modules/projects/entities/project.entity';
import { TaskDocument } from 'src/modules/tasks/entities/task.entity';
import { UserDocument } from 'src/modules/users/entities/user.entity';

export type TimeLogDocument = HydratedDocument<TimeLog>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class TimeLog extends Document {
  @Prop()
  description: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  duration: number;

  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;
}

export const TimeLogSchema = SchemaFactory.createForClass(TimeLog);

TimeLogSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

TimeLogSchema.virtual('project', {
  ref: 'Project',
  localField: 'projectId',
  foreignField: '_id',
  justOne: true,
});

TimeLogSchema.virtual('task', {
  ref: 'Task',
  localField: 'taskId',
  foreignField: '_id',
  justOne: true,
});

// Truy vấn: "Lấy tất cả log của User A trong Project B"
TimeLogSchema.index({ userId: 1, projectId: 1 });

// Truy vấn: "Lấy log của Task X sắp xếp theo thời gian mới nhất"
TimeLogSchema.index({ taskId: 1, loggedAt: -1 });

// Truy vấn báo cáo: "Thống kê thời gian của Project P trong tháng vừa qua"
TimeLogSchema.index({ projectId: 1, loggedAt: 1 });

export type TimeLogWithRelations = TimeLog & {
  task?: Partial<TaskDocument>;
  user?: Partial<UserDocument>;
  project?: Partial<ProjectDocument>;
};
