import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMemberDto {
  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsNumberString()
  @IsOptional()
  pageSize?: string;

  @IsString()
  @IsOptional()
  memberId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;
}
