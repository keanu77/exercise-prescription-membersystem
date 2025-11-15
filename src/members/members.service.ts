import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  // 自動產生 memberId（例如：M00001）
  private async generateMemberId(): Promise<string> {
    // 取得最後一筆會員的 id
    const lastMember = await this.prisma.member.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });

    const nextId = lastMember ? lastMember.id + 1 : 1;
    return `M${String(nextId).padStart(5, '0')}`;
  }

  // 新增會員
  async create(createMemberDto: CreateMemberDto) {
    // 檢查電話是否已存在
    const existingPhone = await this.prisma.member.findUnique({
      where: { phone: createMemberDto.phone },
    });

    if (existingPhone) {
      throw new ConflictException('電話號碼已被使用');
    }

    // 檢查 Email 是否已存在（如果有提供）
    if (createMemberDto.email) {
      const existingEmail = await this.prisma.member.findUnique({
        where: { email: createMemberDto.email },
      });

      if (existingEmail) {
        throw new ConflictException('Email 已被使用');
      }
    }

    // 驗證生日不得晚於今日
    if (createMemberDto.birthday) {
      const birthday = new Date(createMemberDto.birthday);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (birthday > today) {
        throw new BadRequestException('生日不得晚於今日');
      }
    }

    // 自動產生 memberId
    const memberId = await this.generateMemberId();

    // 建立會員
    const member = await this.prisma.member.create({
      data: {
        memberId,
        name: createMemberDto.name,
        phone: createMemberDto.phone,
        email: createMemberDto.email,
        birthday: createMemberDto.birthday ? new Date(createMemberDto.birthday) : null,
        note: createMemberDto.note,
      },
    });

    return member;
  }

  // 取得會員列表（支援分頁與搜尋）
  async findAll(query: QueryMemberDto) {
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '10');
    const skip = (page - 1) * pageSize;

    // 建立搜尋條件
    const where: any = {
      isActive: true, // 預設只顯示啟用的會員
    };

    if (query.memberId) {
      where.memberId = { contains: query.memberId };
    }

    if (query.name) {
      where.name = { contains: query.name };
    }

    if (query.phone) {
      where.phone = { contains: query.phone };
    }

    if (query.email) {
      where.email = { contains: query.email };
    }

    // 查詢總筆數
    const total = await this.prisma.member.count({ where });

    // 查詢會員資料
    const data = await this.prisma.member.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 取得單一會員
  async findOne(id: number) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException('找不到該會員');
    }

    return member;
  }

  // 更新會員
  async update(id: number, updateMemberDto: UpdateMemberDto) {
    // 確認會員存在
    const member = await this.findOne(id);

    // 檢查電話是否與其他會員重複
    if (updateMemberDto.phone && updateMemberDto.phone !== member.phone) {
      const existingPhone = await this.prisma.member.findUnique({
        where: { phone: updateMemberDto.phone },
      });

      if (existingPhone) {
        throw new ConflictException('電話號碼已被使用');
      }
    }

    // 檢查 Email 是否與其他會員重複
    if (updateMemberDto.email && updateMemberDto.email !== member.email) {
      const existingEmail = await this.prisma.member.findUnique({
        where: { email: updateMemberDto.email },
      });

      if (existingEmail) {
        throw new ConflictException('Email 已被使用');
      }
    }

    // 驗證生日不得晚於今日
    if (updateMemberDto.birthday) {
      const birthday = new Date(updateMemberDto.birthday);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (birthday > today) {
        throw new BadRequestException('生日不得晚於今日');
      }
    }

    // 更新會員資料
    const updatedMember = await this.prisma.member.update({
      where: { id },
      data: {
        name: updateMemberDto.name,
        phone: updateMemberDto.phone,
        email: updateMemberDto.email,
        birthday: updateMemberDto.birthday ? new Date(updateMemberDto.birthday) : undefined,
        note: updateMemberDto.note,
        isActive: updateMemberDto.isActive,
      },
    });

    return updatedMember;
  }

  // 刪除會員（軟刪除）
  async remove(id: number) {
    // 確認會員存在
    await this.findOne(id);

    // 軟刪除：設定 isActive 為 false
    const deletedMember = await this.prisma.member.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      message: '會員已刪除',
      member: deletedMember,
    };
  }
}
