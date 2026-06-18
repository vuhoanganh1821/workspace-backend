import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from 'src/common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  getMyConversations(@CurrentUserId() userId: string) {
    return this.chatService.getMyConversations(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('direct-room')
  getOrCreateDirectRoom(
    @CurrentUserId() currentUserId: string,
    @Body('targetUserId') targetUserId: string,
  ) {
    return this.chatService.getOrCreateDirectConversation(
      currentUserId,
      targetUserId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('group-room')
  createGroup(
    @CurrentUserId() adminId: string,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    return this.chatService.createGroupConversation(
      adminId,
      createGroupDto?.name,
      createGroupDto?.members,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations/:conversationId/messages')
  getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getConversationMessages(
      conversationId,
      limit ? Number(limit) : 50,
    );
  }
}
