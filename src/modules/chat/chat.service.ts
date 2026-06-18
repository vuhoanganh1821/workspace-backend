import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EConversationType } from 'src/enums';
import { UserDocument } from '../users/entities/user.entity';
import {
  Conversation,
  ConversationDocument,
} from './entities/conversation.entity';
import { Message, MessageDocument } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,

    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
  ) {}

  async getOrCreateDirectConversation(userA: string, userB: string) {
    const memberIds = [new Types.ObjectId(userA), new Types.ObjectId(userB)];

    const foundConversation = await this.conversationModel.findOne({
      type: EConversationType.DIRECT,
      members: { $all: memberIds, $size: 2 },
    });

    if (foundConversation) {
      return foundConversation;
    }

    return this.conversationModel.create({
      type: EConversationType.DIRECT,
      members: memberIds,
    });
  }

  // 2. Admin tạo Group Chat
  async createGroupConversation(
    adminId: string,
    name: string,
    memberIds: string[],
  ) {
    const allMembers = [adminId, ...memberIds].map(
      (id) => new Types.ObjectId(id),
    );

    return this.conversationModel.create({
      type: EConversationType.GROUP,
      name,
      members: allMembers,
      createdBy: new Types.ObjectId(adminId),
    });
  }

  // 3. Lưu tin nhắn mới vào Database
  async saveMessage(conversationId: string, senderId: string, content: string) {
    const newMessage = await this.messageModel.create({
      conversationId: new Types.ObjectId(conversationId),
      senderId: new Types.ObjectId(senderId),
      content,
    });
    return newMessage;
  }

  // 4. Lấy danh sách tất cả các cuộc hội thoại mà user hiện tại tham gia
  async getMyConversations(userId: string) {
    const foundConversation = await this.conversationModel
      .find({ members: new Types.ObjectId(userId) })
      .populate<{ members: UserDocument[] }>('members', 'fullName email avatar')
      .sort({ updatedAt: -1 })
      .exec();

    const myConversations = foundConversation.map((conversation) => {
      const conversationObj = conversation.toObject();

      conversationObj.members = conversationObj.members.filter(
        (member: UserDocument) => String(member?._id) !== userId,
      );
      return conversationObj;
    });

    return myConversations;
  }

  // 5. Lấy lịch sử tin nhắn của một phòng chat (có phân trang sơ bộ)
  async getConversationMessages(conversationId: string, limit = 50) {
    return this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .populate('senderId', 'fullName email avatar') // Lấy kèm thông tin người gửi để FE hiển thị tên/avatar cạnh tin nhắn
      .sort({ createdAt: 1 }) // Sắp xếp từ cũ đến mới để FE scroll xuống dưới
      .limit(limit)
      .exec();
  }
}
