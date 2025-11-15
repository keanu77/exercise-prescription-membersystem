import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            username: string;
        };
    }>;
    validateUser(userId: number): Promise<{
        id: number;
        username: string;
        createdAt: Date;
    }>;
}
