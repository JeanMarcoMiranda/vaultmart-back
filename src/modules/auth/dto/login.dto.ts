import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  // The tenant is identified by the ID in the body or by the slug in the URL
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;
}
