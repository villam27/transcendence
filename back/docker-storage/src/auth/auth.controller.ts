import { Body, Controller, Get, Post, Request, Res, UseFilters, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserSubDto } from './dtos/user-sub.dto';
import { UserEntity } from '../database/entities/user.entity';
import { LoginCreditDto } from './dtos/login-credit.dto';
import { FtOAuthGuard } from './guards/ft-auth.guards';
import { ftLoginDto } from './dtos/ft-login.dto';
import { FtAuthFilter } from './filters/ftAuth.filter';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  async Register(@Body() userData: UserSubDto): Promise<Partial<UserEntity>> {
    return await this.authService.register(userData);
  }

  @Post('/login')
  async Login(
    @Body() credentials: LoginCreditDto,
    // @Res() res: Response
  ) {
    return await this.authService.login(credentials); // return acces_token
  }

  @Get('login/42')
  @UseGuards(FtOAuthGuard)
  auth42() {
    return 'login';
  }

  @Get('callback/42')
  @UseGuards(FtOAuthGuard)
  @UseFilters(FtAuthFilter)
  async auth42callback(@Request() req, @Res() res) {
    console.log('id: ', req.user.id);
    console.log('token: ', req.user.ftToken);
    // const user = req.profile.user;
    const token = await this.authService.ftLogin({
      username: req.user.username,
      urlImg: req.user._json.image.link,
      id42: req.user.id,
    } as ftLoginDto);

    return res.redirect(
      'http://localhost:3000?' + new URLSearchParams({ 'access-token': token, 'ftToken': req.user.ftToken }),
    );
  }

  @Post('2fa/42')
  async twoFa42(@Body() body) {
    console.log(body);
    const token = await this.authService.ftLogin2fa(body.ftToken, body.code2fa);
    console.log('token: ', token);
    console.log('yes ?');
    return token;
    // return this.authService.ftLogin2fa(body.ftToken, body.code2fa);
  }
}
