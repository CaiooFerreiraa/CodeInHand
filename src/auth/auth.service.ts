import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserDataDto } from 'src/users/dto/users.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { randomUUID, createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { db, sessionTables } from 'src/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

type PayloadUser = {
  sub: number,
  username: string,
  sessionId: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(
    username: string,
    pass: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user: UserDataDto = await this.userService.findOne(username);

    if (user.password !== pass) throw new UnauthorizedException();

    const sessionId = randomUUID();

    const payload: PayloadUser = { sub: user.uid, username: user.name, sessionId };

    const access_token = await this.jwtService.signAsync(payload);

    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const hashRefreshToken = this.#hash256(refresh_token);

    try {
      await db.insert(sessionTables).values({
        id: sessionId,
        userId: user.uid,
        refreshToken: hashRefreshToken
      });
    } catch (error) {
      throw error;
    }

    return {
      access_token,
      refresh_token,
    };
  }

  #hash256(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async refreshToken(refreshTokenWeb: string) {
    try {
      const payload: PayloadUser = await this.jwtService.verifyAsync(refreshTokenWeb, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const [session] = await db
        .select({
          refreshToken: sessionTables.refreshToken
        })
        .from(sessionTables)
        .where(
          and(
            eq(sessionTables.id, payload.sessionId), 
            isNull(sessionTables.revokedAt)
          )
        )

      if (!session) {
        throw new UnauthorizedException('Sessão inválida ou expirada')
      }

      const hash = this.#hash256(refreshTokenWeb)

      if (hash !== session.refreshToken) throw new UnauthorizedException("Refresh token inválido ou expirado") 

      const newAccessToken = await this.#generateAccessToken(payload);

      return {
        access_token: newAccessToken
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  async #generateAccessToken(payload: PayloadUser) {
    return await this.jwtService.signAsync(payload);
  }
}
