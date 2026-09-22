import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/shared/decorators/auth.decorators';
import { UserLogin, UserLogout, UserRefresh } from './dto/auth-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("/login")
  async login(@Body() signInDto: UserLogin) {
    const tokens = await this.authService.login(signInDto.username, signInDto.password)
    return tokens
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() signout: UserLogout) {
    await this.authService.logout(signout.token);
  }
    
  @Post("/refresh")
  async refreshToken(@Body() body: UserRefresh) {
    return await this.authService.refresh(body.token);
  }
}
