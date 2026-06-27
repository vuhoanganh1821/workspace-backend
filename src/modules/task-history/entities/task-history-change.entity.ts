import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class TaskHistoryChange {
  @Prop({ required: true })
  field: string;

  @Prop()
  oldValue: string;

  @Prop()
  newValue: string;
}

export const TaskHistoryChangeSchema =
  SchemaFactory.createForClass(TaskHistoryChange);
