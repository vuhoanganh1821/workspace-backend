import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ETaskPriority, ETaskStatus, ETaskType } from 'src/enums';
import { ProjectDocument } from 'src/modules/projects/entities/project.entity';
import { SprintDocument } from 'src/modules/sprints/entities/sprint.entity';
import { UserDocument } from 'src/modules/users/entities/user.entity';

export type TaskDocument = HydratedDocument<Task>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Task {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  attachments: string[];

  @Prop({
    enum: [
      ETaskStatus.TODO,
      ETaskStatus.IN_PROGRESS,
      ETaskStatus.CODING_DONE,
      ETaskStatus.TESTING,
      ETaskStatus.DONE,
    ],
    default: ETaskStatus.TODO,
  })
  status: ETaskStatus;

  @Prop({
    enum: [
      ETaskPriority.LOW,
      ETaskPriority.MEDIUM,
      ETaskPriority.HIGH,
      ETaskPriority.URGENT,
    ],
    default: ETaskPriority.MEDIUM,
  })
  priority: string;

  @Prop({
    enum: [
      ETaskType.DESIGN,
      ETaskType.FRONTEND,
      ETaskType.BACKEND,
      ETaskType.MANAGEMENT,
      ETaskType.DOCUMENTATION,
      ETaskType.RESEARCH,
      ETaskType.ARCHITECTURE,
      ETaskType.BUG,
      ETaskType.TESTING,
    ],
  })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assigneeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sprint' })
  sprintId: Types.ObjectId;

  @Prop()
  startDate: Date;

  @Prop()
  dueDate: Date;

  @Prop()
  completionDate: Date;

  @Prop({ default: 0 })
  reopenCount: number;

  @Prop({ default: 0 })
  estimatedHours: number;

  @Prop({ default: 0 })
  totalSpentHours: number;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.virtual('project', {
  ref: 'Project',
  localField: 'projectId',
  foreignField: '_id',
  justOne: true,
});

TaskSchema.virtual('sprint', {
  ref: 'Sprint',
  localField: 'sprintId',
  foreignField: '_id',
  justOne: true,
});

TaskSchema.virtual('assignee', {
  ref: 'User',
  localField: 'assigneeId',
  foreignField: '_id',
  justOne: true,
});

TaskSchema.index({ projectId: 1, assigneeId: 1 });

export type TaskWithRelations = Task & {
  assignee?: Partial<UserDocument>;
  project?: Partial<ProjectDocument>;
  sprint?: Partial<SprintDocument>;
};
