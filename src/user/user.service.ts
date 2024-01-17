import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import UserRoleEnum from 'src/enums/userRole.enum';
import UserStatusEnum from 'src/enums/userStatus.enum';

require('dotenv').config();

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { email, password } = createUserDto;

      console.log(createUserDto);

      // Check for Duplicate Details
      const existingUser = await this.userRepository.findOne({
        where: { email: email, },
      });

      if (existingUser) {
        throw new HttpException(
          `Email is already registered with this account`,
          HttpStatus.CONFLICT,
        );
      }

      console.log('No duplicate email');

      // hash password for security purpose
      const hashedPassword = await bcrypt.hash(
        password,
        parseInt(process.env.BCRYPT_HASH),
      );

      let roleEnum;
      if (createUserDto.role === 'Tutor') {
        roleEnum = UserRoleEnum.TUTOR;
      } else {
        roleEnum = UserRoleEnum.TUTEE;
      }

      const newUser = new User({
        ...createUserDto,
        password: hashedPassword,
      });

      console.log(newUser);

      await this.userRepository.save(newUser);

      return {
        statusCode: HttpStatus.OK,
        message: 'User created successfully',
        data: newUser,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred during the update.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async signIn(email: string, passwordProvided: string, role: string) {
    try {
      let roleEnum;
      if (role === 'Tutor') {
        roleEnum = UserRoleEnum.TUTOR;
      } else if (role === 'Tutee') {
        roleEnum = UserRoleEnum.TUTEE;
      } else {
        throw new HttpException(
          'Invalid role specified',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Find the user by email based on the role
      const retrievedUser = await this.userRepository.findOne({
        where: { email },
      });

      if (!retrievedUser) {
        throw new HttpException(
          `User ${email} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // check if user is inactive or not
      if (retrievedUser.status === UserStatusEnum.INACTIVE) {
        throw new HttpException(
          `User ${email} account status is Inactive. Please contact our Admin if you want to activate back your account.`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check the password
      const isPasswordCorrect = await bcrypt.compare(
        passwordProvided,
        retrievedUser.password,
      );

      if (!isPasswordCorrect) {
        throw new HttpException(
          'Incorrect password provided',
          HttpStatus.NOT_FOUND,
        );
      }

      // Check the user role
      if (retrievedUser.role !== roleEnum) {
        throw new HttpException(
          `User ${email} of ${roleEnum} role is not found.`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Generate JWT token
      const payload = {
        sub: retrievedUser.userId,
        // username: retrievedUser.userName,
        email: retrievedUser.email,
        role: retrievedUser.role,
      };
      const jwtAccessToken = await this.jwtService.signAsync(payload);

      // Return the user data and JWT token
      const { password, ...retrievedUserWithoutPassword } = retrievedUser;
      return {
        statusCode: HttpStatus.OK,
        message: `User ${email} found`,
        data: retrievedUserWithoutPassword,
        jwtAccessToken: jwtAccessToken,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred during the update.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll() {
    try {
      const userList = await this.userRepository.find({});

      return {
        statusCode: HttpStatus.OK,
        message: 'Users found',
        data: userList,
      };
    } catch (error) {
      throw new NotFoundException('No users found');
    }
  }

  async findByUserId(userId: string, role: string) {
    try {
      let roleEnum;
      if (role === 'Tutor') {
        roleEnum = UserRoleEnum.TUTOR;
      } else if (role === 'Tutee') {
        roleEnum = UserRoleEnum.TUTEE;
      }

      const retrievedUser = await this.userRepository.findOne({
        where: { userId: userId, role: roleEnum },
      });

      if (retrievedUser) {
        return {
          statusCode: HttpStatus.OK,
          message: 'User found',
          data: retrievedUser,
        };
      } else {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      throw new HttpException(
        error.response || 'Failed to find user',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
