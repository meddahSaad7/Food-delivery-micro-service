import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ActivationDto, LoginDto, RegisterDto } from './dto/user.dto';
import { PrismaService } from '../../../prisma/Prisma.service';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { EmailService } from './email/email.service';
interface UserData {
  name: string;
  email: string;
  password: string;
  phone_number: number;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // register user service
  async register(registerDto: RegisterDto, response: Response) {
    const { name, email, password, phone_number } = registerDto;
    const isEmailExist = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (isEmailExist) {
      throw new BadRequestException('User already exist with this email!');
    }

    const isPhoneNumberExist = await this.prisma.user.findUnique({
      where: {
        phone_number,
      },
    });

    if (isPhoneNumberExist) {
      throw new BadRequestException(
        'User already exist with this phone number!',
      );
    }

    // hashed password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      name,
      email,
      password: hashedPassword,
      phone_number,
    };
    const activation_token1 = await this.createActivationToken(user);
    const activationCode = activation_token1.activationCode;
    const activation_token = activation_token1.token;
    await this.emailService.sendMail({
      email,
      subject: 'Activate your account!',
      template: './activation-mail',
      name,
      activationCode,
    });

    console.log(activation_token, response, 'activation_token.......');
    return { activation_token, response };
  }
  // activation user
  async activateUser(activationDto: ActivationDto, response: Response) {
    const { activation_token, activationCode } = activationDto;
    const newUser: { user: UserData; activationCode: string } =
      this.jwtService.verify(activation_token, {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
      });
    if (newUser.activationCode !== activationCode) {
      throw new BadRequestException('Invalid activation code.');
    }

    const { name, email, password, phone_number } = newUser.user;
    const existUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existUser) {
      throw new BadRequestException('User already exist with this email!');
    }
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password,
        phone_number,
      },
    });
    console.log(user, 'user.............');
    return { user, response };
  }
  // create activation token
  async createActivationToken(user: UserData) {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = this.jwtService.sign(
      {
        user,
        activationCode,
      },
      {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
        expiresIn: '5h',
      },
    );
    return { token, activationCode };
  }
  // login user service
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = {
      email,
      password,
    };
    return user;
  }

  async getUsers() {
    return this.prisma.user.findMany({});
  }
}
