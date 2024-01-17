import UserRoleEnum from 'src/enums/userRole.enum';

export class SignInDto {
  email: string;
  password: string;
  role: UserRoleEnum;
}
