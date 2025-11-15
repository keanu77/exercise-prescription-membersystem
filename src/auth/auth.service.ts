import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // 查詢管理員
    const admin = await this.prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }

    // 產生 JWT token
    const payload = { sub: admin.id, username: admin.username };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: admin.id,
        username: admin.username,
      },
    };
  }

  async validateUser(userId: number) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: userId },
      select: { id: true, username: true, createdAt: true },
    });

    if (!admin) {
      throw new UnauthorizedException('無效的使用者');
    }

    return admin;
  }
}
