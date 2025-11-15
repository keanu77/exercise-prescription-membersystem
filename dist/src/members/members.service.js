"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MembersService = class MembersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateMemberId() {
        const lastMember = await this.prisma.member.findFirst({
            orderBy: { id: 'desc' },
            select: { id: true },
        });
        const nextId = lastMember ? lastMember.id + 1 : 1;
        return `M${String(nextId).padStart(5, '0')}`;
    }
    async create(createMemberDto) {
        const existingPhone = await this.prisma.member.findUnique({
            where: { phone: createMemberDto.phone },
        });
        if (existingPhone) {
            throw new common_1.ConflictException('電話號碼已被使用');
        }
        if (createMemberDto.email) {
            const existingEmail = await this.prisma.member.findUnique({
                where: { email: createMemberDto.email },
            });
            if (existingEmail) {
                throw new common_1.ConflictException('Email 已被使用');
            }
        }
        if (createMemberDto.birthday) {
            const birthday = new Date(createMemberDto.birthday);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (birthday > today) {
                throw new common_1.BadRequestException('生日不得晚於今日');
            }
        }
        const memberId = await this.generateMemberId();
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
    async findAll(query) {
        const page = parseInt(query.page || '1');
        const pageSize = parseInt(query.pageSize || '10');
        const skip = (page - 1) * pageSize;
        const where = {
            isActive: true,
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
        const total = await this.prisma.member.count({ where });
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
    async findOne(id) {
        const member = await this.prisma.member.findUnique({
            where: { id },
        });
        if (!member) {
            throw new common_1.NotFoundException('找不到該會員');
        }
        return member;
    }
    async update(id, updateMemberDto) {
        const member = await this.findOne(id);
        if (updateMemberDto.phone && updateMemberDto.phone !== member.phone) {
            const existingPhone = await this.prisma.member.findUnique({
                where: { phone: updateMemberDto.phone },
            });
            if (existingPhone) {
                throw new common_1.ConflictException('電話號碼已被使用');
            }
        }
        if (updateMemberDto.email && updateMemberDto.email !== member.email) {
            const existingEmail = await this.prisma.member.findUnique({
                where: { email: updateMemberDto.email },
            });
            if (existingEmail) {
                throw new common_1.ConflictException('Email 已被使用');
            }
        }
        if (updateMemberDto.birthday) {
            const birthday = new Date(updateMemberDto.birthday);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (birthday > today) {
                throw new common_1.BadRequestException('生日不得晚於今日');
            }
        }
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
    async remove(id) {
        await this.findOne(id);
        const deletedMember = await this.prisma.member.update({
            where: { id },
            data: { isActive: false },
        });
        return {
            message: '會員已刪除',
            member: deletedMember,
        };
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MembersService);
//# sourceMappingURL=members.service.js.map