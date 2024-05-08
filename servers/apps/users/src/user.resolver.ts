import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/user.dto';
import { RegisterReponse } from './types/user.types';
import { BadRequestException, Query } from '@nestjs/common';
import { User } from './entities/user.entity';

@Resolver('User')
export class UsersResolver {
  constructor(private readonly userService: UsersService) {}
  @Mutation(() => RegisterReponse)
  async register(
    @Args('registerInput') registerDto: RegisterDto,
  ): Promise<RegisterReponse> {
    if (!registerDto.name || !registerDto.email || !registerDto.password) {
      throw new BadRequestException('Please fill the all fields.');
    }
    const user = await this.userService.register(registerDto);
    return { user };
  }

  @Query(() => [User])
  async getUsers() {
    return this.userService.getUsers();
  }
}