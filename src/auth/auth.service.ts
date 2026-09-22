import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserDataDto } from 'src/users/dto/users.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { db, sessionTable, tokensTable } from 'src/db/schema';
import { and, EmptyRelations, eq, isNull } from 'drizzle-orm';
import { hash } from '../shared/utils/hash';
import { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import { PgAsyncTransaction } from 'drizzle-orm/pg-core';

type PayloadUser = {
  sub: number;
  username: string;
  sessionId: string;
  jti: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(
    username: string,
    pass: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user: UserDataDto = await this.userService.findOne(username);

    if (user.password !== pass) throw new UnauthorizedException();

    const payload: PayloadUser = {
      sub: user.uid,
      username: user.name,
      sessionId: randomUUID(),
      jti: randomUUID(),
    };

    const access_token = await this.jwtService.signAsync(payload);

    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const hashRefreshToken = hash(refresh_token);

    try {
      await db.transaction(async (tx) => {
        await tx.insert(sessionTable).values({
          id: payload.sessionId,
          userId: payload.sub,
        });

        await tx.insert(tokensTable).values({
          id: payload.jti,
          token: hashRefreshToken,
          sessionId: payload.sessionId,
        });
      });
    } catch (error) {
      throw error;
    }

    return {
      access_token,
      refresh_token,
    };
  }

  async refresh(refreshTokenWeb: string) {
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
        .innerJoin(sessionTable, eq(sessionTable.id, tokensTable.sessionId))
        .where(
          and(
            eq(tokensTable.sessionId, payload.sessionId),
            eq(tokensTable.id, payload.jti),
            isNull(tokensTable.revokedAt),
            isNull(sessionTable.revokedAt),
          ),
        );

      if (!session)
        throw new UnauthorizedException('Sessão inválida ou expirada');

      const hashRefreshTokenWeb = hash(refreshTokenWeb);

      if (hashRefreshTokenWeb !== session.token)
        throw new UnauthorizedException('Refresh token inválido ou expirado');

      const tokens = await db.transaction(async (tx) => {
        await this.#revokeRefreshToken(payload.jti, payload.sessionId, tx);

        return await this.#generateTokens(payload, tx);
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  async logout(token: string) {
    const payload: PayloadUser = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    const failedToRevoked = await db.transaction(async (tx) => {
      const data = new Date();

      const lineUpdateSessions = await tx
        .update(sessionTable)
        .set({ revokedAt: data })
        .where(
          and(
            eq(sessionTable.id, payload.sessionId),
            isNull(sessionTable.revokedAt),
          ),
        )
        .returning();

      await tx
        .update(tokensTable)
        .set({ revokedAt: data })
        .where(
          and(
            eq(tokensTable.sessionId, payload.sessionId),
            isNull(tokensTable.revokedAt),
          ),
        )

      return lineUpdateSessions.length === 0
    });

    if (failedToRevoked)
      throw new Error('Houve erro na atualização do banco de dados');
  }

  async #revokeRefreshToken(
    jti: string,
    sessionId: string,
    tx: PgAsyncTransaction<NodePgQueryResultHKT, EmptyRelations>,
  ) {

    const lineUpdateTokens = await tx
      .update(tokensTable)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(tokensTable.id, jti),
          eq(tokensTable.sessionId, sessionId), 
          isNull(tokensTable.revokedAt)
        ),
      )
      .returning();

    if (lineUpdateTokens.length === 0)
      throw new Error('Não houve nenhuma alteração no banco');
  }

  async #generateTokens(
    payload: PayloadUser,
    tx: PgAsyncTransaction<NodePgQueryResultHKT, EmptyRelations>,
  ) {
    const newPayload: PayloadUser = {
      ...payload,
      jti: randomUUID()
    }

    const refresh_token = await this.jwtService.signAsync(newPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    try {
      await tx.insert(tokensTable).values({
        sessionId: newPayload.sessionId,
        token: hash(refresh_token),
        id: newPayload.jti,
      });
    } catch (error) {
      throw error;
    }

    return {
      access_token: await this.jwtService.signAsync(newPayload),
      refresh_token,
    };
  }
}
