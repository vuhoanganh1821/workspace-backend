import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EConversationType } from 'src/enums';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({
    type: String,
    enum: [EConversationType.DIRECT, EConversationType.GROUP],
    default: EConversationType.DIRECT,
  })
  type: string;

  @Prop({ type: String })
  name?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  members: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
