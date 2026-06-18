import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Trong thực tế, hãy thay bằng domain client của bạn
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  // Map để lưu trữ danh sách user đang online: userId -> socketId
  private activeConnections = new Map<string, string>();

  afterInit(server: Server) {
    console.log('Init Socket Server Success!');
  }

  // Xử lý khi có user kết nối
  handleConnection(client: Socket) {
    // Thử lấy userId từ query
    const userId = client.handshake.query.userId as string;

    if (userId) {
      this.activeConnections.set(String(userId), client.id);
      console.log(`=> Đã lưu User ${userId} vào danh sách online.`);
    }
  }

  // Xử lý khi user ngắt kết nối
  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.activeConnections.entries()) {
      if (socketId === client.id) {
        this.activeConnections.delete(userId);
        console.log(`User ${userId} đã ngắt kết nối.`);
        break;
      }
    }
  }

  // Lắng nghe event từ client gửi lên
  @SubscribeMessage('sendMessage')
  handleMessage(
    client: Socket,
    payload: { senderId: string; receiverId: string; message: string },
  ): void {
    const senderId = String(payload.senderId);
    const receiverId = String(payload.receiverId);
    const message = payload.message;

    // 1. (Tùy chọn) Gọi Service để lưu tin nhắn vào Database tại đây
    // this.chatService.saveMessage({ senderId, receiverId, message });

    // 2. Tìm socketId của người nhận
    const receiverSocketId = this.activeConnections.get(receiverId);

    if (receiverSocketId) {
      // Nếu người nhận đang online, gửi thẳng tin nhắn cho họ
      this.server.to(receiverSocketId).emit('receiveMessage', {
        senderId,
        message,
        timestamp: new Date(),
      });
    } else {
      console.log(
        `User ${receiverId} hiện đang offline. Tin nhắn đã được lưu vào DB.`,
      );
    }
  }
}
