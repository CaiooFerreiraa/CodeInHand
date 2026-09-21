import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserDataDto } from 'src/users/dto/users.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { db, sessionTable, tokensTable } from 'src/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { hash } from '../shared/utils/hash';

type PayloadUser = {
  sub: number;
  username: string;
  sessionId: string;
};

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

    const payload: PayloadUser = {
      sub: user.uid,
      username: user.name,
      sessionId,
    };

    const access_token = await this.jwtService.signAsync(payload);

    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const hashRefreshToken = hash(refresh_token);

    try {
      await db.insert(tokensTable).values({
        token: hashRefreshToken,
        sessionId: sessionId,
      });
    } catch (error) {
      throw error;
    }

    return {
      access_token,
      refresh_token,
    };
  }

  async refreshToken(refreshTokenWeb: string) {
    try {
      const payload: PayloadUser = await this.jwtService.verifyAsync(
        refreshTokenWeb,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      const [session] = await db
        .select({
          token: tokensTable.token,
        })
        .from(tokensTable)
        .where(
          and(
            eq(tokensTable.sessionId, payload.sessionId),
            isNull(tokensTable.revokedAt),
          ),
        );

      if (!session)
        throw new UnauthorizedException('Sessão inválida ou expirada');

      const hashRefreshTokenWeb = hash(refreshTokenWeb);

      if (hashRefreshTokenWeb !== session.token)
        throw new UnauthorizedException('Refresh token inválido ou expirado');

      const newAccessToken = await this.#generateAccessToken(payload);

      return {
        access_token: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  async revokeToken(token: string) {
    const hashToken = hash(token);

    try {
      await db
        .update(tokensTable)
        .set({ revokedAt: new Date() })
        .where(
          eq(tokensTable.token, hashToken)
        );
    } catch (error) {
      throw new UnauthorizedException("Token inválido ou expirado")
    }
  }

  async #generateAccessToken(payload: PayloadUser) {
    return await this.jwtService.signAsync(payload);
  }
}
