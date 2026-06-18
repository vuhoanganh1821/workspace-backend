import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const foundUser = await this.userModel
      .findOne({ email: dto.email })
      .select('+passwordHash')
      .lean();

    if (!foundUser) {
      throw new UnauthorizedException('Email or password is incorrect!');
    }

    const isMatch = await bcrypt.compare(
      dto?.password,
      foundUser?.passwordHash,
    );

    if (!isMatch)
      throw new UnauthorizedException('Email or password is incorrect!');

    const payload = {
      sub: foundUser?._id,
      email: foundUser?.email,
    };

    const { _id, email, fullName, avatar, role } = foundUser;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1d',
    });

    return { _id, email, fullName, avatar, role, accessToken };
  }
}
