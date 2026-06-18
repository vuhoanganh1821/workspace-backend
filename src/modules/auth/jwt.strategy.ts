import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      // Tự động tìm và trích xuất token dạng: Bearer <token> ở Header Authorization
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Từ chối request ngay nếu token đã quá hạn
      secretOrKey: process.env.JWT_SECRET ?? '', // Nên để trong file .env
    });
  }

  async validate(payload: any) {
    // Payload là cục data bên trong JWT sau khi decode thành công
    // Những gì return ở đây sẽ được gán thẳng vào req.user
    return { userId: payload?.sub, email: payload?.email };
  }
}
