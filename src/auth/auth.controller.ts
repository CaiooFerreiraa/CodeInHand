import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/shared/decorators/auth.decorators';
import { ConfigService } from '@nestjs/config';

type UserLogin = {
  username: string,
  password: string
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("/login")
  async login(@Body() signInDto: UserLogin) {
    const tokens = await this.authService.generateTokens(signInDto.username, signInDto.password)
    return tokens
  }

  @Get('/logout')
  getProfile(@Request() req: any) {
    return req.user
  }
    
  @Post("refresh")
  async refreshToken(@Body() body: any ) {
    return 200;
  }
}
