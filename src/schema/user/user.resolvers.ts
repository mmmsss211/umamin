/* eslint-disable no-console */
import { Resolver, Query, Mutation, Arg, Ctx } from 'type-graphql';
import { customAlphabet } from 'nanoid';
import bcrypt from 'bcrypt';

import { User } from '.';
import type { TContext } from '@/pages/api/graphql';

@Resolver()
export class UserResolver {
  @Query(() => User)
  async user(
    @Arg('username', () => String) username: string,
    @Ctx() { prisma }: TContext
  ): Promise<User> {
    let data = {} as User;

    try {
      const _data = await prisma.user.findUnique({ where: { username } });

      if (!_data) {
        throw new Error('User not found');
      }

      data = _data;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message);
    }

    return data;
  }

  @Mutation(() => String)
  async login(
    @Arg('username', () => String) username: string,
    @Arg('password', () => String) password: string,
    @Ctx() { prisma }: TContext
  ): Promise<String | null> {
    const data = await this.user(username, { prisma });

    if (!(await bcrypt.compare(password, data.password))) {
      throw new Error('Incorrect credentials');
    }

    return data.username;
  }

  @Mutation(() => User)
  async createUser(
    @Arg('username', () => String) username: string,
    @Ctx() { prisma }: TContext
  ): Promise<User | null> {
    const pin = customAlphabet('1234567890', 6);
    const defaultPassword = pin();

    const password = await bcrypt.hash(defaultPassword, 10);

    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (user) {
        throw new Error('Link already taken');
      }

      await prisma.user.create({
        data: {
          username,
          password,
        },
      });
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message);
    }

    return {
      username,
      password: defaultPassword,
    };
  }
}
