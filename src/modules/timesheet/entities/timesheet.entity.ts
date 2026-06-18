import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TimesheetDocument = HydratedDocument<Timesheet>;

@Schema({ timestamps: true })
export class Timesheet {
  @Prop({ required: true })
  taskName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  hourlyRate: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task' })
  taskId: Types.ObjectId;
}

export const TimesheetSchema = SchemaFactory.createForClass(Timesheet);
