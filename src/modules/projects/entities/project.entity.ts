import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  companyName: string;

  @Prop()
  companyWebsite: string;

  @Prop()
  companyPhone: string;

  @Prop()
  city: string;

  @Prop()
  logo: string;

  @Prop()
  customer: string;

  @Prop()
  address: string;

  @Prop()
  customerEmail: string;

  @Prop()
  customerPhone: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
