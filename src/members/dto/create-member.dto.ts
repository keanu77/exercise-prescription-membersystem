import { IsString, IsNotEmpty, IsEmail, IsOptional, IsDateString } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty({ message: '姓名為必填欄位' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: '電話為必填欄位' })
  phone: string;

  @IsEmail({}, { message: 'Email 格式不正確' })
  @IsOptional()
  email?: string;

  @IsDateString({}, { message: '生日格式不正確' })
  @IsOptional()
  birthday?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
