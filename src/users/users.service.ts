import { Injectable } from '@nestjs/common';
import { eq, ilike, name } from 'drizzle-orm';
import { db, usersTable } from 'src/db/schema';

export type User = any;

@Injectable()
export class UsersService {
  constructor(
    private readonly database = db
  ) {}

  async findOne(username: string): Promise<User> {
    return await this.database
      .select()
      .from(usersTable)
      .where(
        ilike(usersTable.username, username)
      )
  }

  async insertUser() {
    
  }
}
