import { IsString, IsEmail, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class UpdateMemberDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail({}, { message: 'Email 格式不正確' })
  @IsOptional()
  email?: string;

  @IsDateString({}, { message: '生日格式不正確' })
  @IsOptional()
  birthday?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
