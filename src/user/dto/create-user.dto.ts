import UserRoleEnum from "src/enums/userRole.enum";

export class CreateUserDto {
    firstName: string;
    lastName: string;
    age: string;
    email: string;
    password: string;
    contactNo: string;
    createdAt: Date;
    role: UserRoleEnum;
}
