import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';
export declare class MembersController {
    private readonly membersService;
    constructor(membersService: MembersService);
    create(createMemberDto: CreateMemberDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        memberId: string;
        phone: string;
        email: string | null;
        birthday: Date | null;
        note: string | null;
        isActive: boolean;
    }>;
    findAll(query: QueryMemberDto): Promise<{
        data: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            memberId: string;
            phone: string;
            email: string | null;
            birthday: Date | null;
            note: string | null;
            isActive: boolean;
        }[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    }>;
    findOne(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        memberId: string;
        phone: string;
        email: string | null;
        birthday: Date | null;
        note: string | null;
        isActive: boolean;
    }>;
    update(id: number, updateMemberDto: UpdateMemberDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        memberId: string;
        phone: string;
        email: string | null;
        birthday: Date | null;
        note: string | null;
        isActive: boolean;
    }>;
    remove(id: number): Promise<{
        message: string;
        member: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            memberId: string;
            phone: string;
            email: string | null;
            birthday: Date | null;
            note: string | null;
            isActive: boolean;
        };
    }>;
}
