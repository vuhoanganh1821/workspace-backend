import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ESprintStatus } from 'src/enums';

export type SprintDocument = HydratedDocument<Sprint>;

@Schema({ timestamps: true })
export class Sprint {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  description: string;

  @Prop({
    enum: [ESprintStatus.ACTIVE, ESprintStatus.COMPLETED],
    default: ESprintStatus.ACTIVE,
  })
  status: string;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;
}

export const SprintSchema = SchemaFactory.createForClass(Sprint);
