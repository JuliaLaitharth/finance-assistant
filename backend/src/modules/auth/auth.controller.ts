import { Body, Controller, HttpCode, Ip, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { BiometriaDto, CadastroDto, EsqueciSenhaDto, LoginDto,
  RedefinirSenhaDto, RefreshDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('cadastro') cadastro(@Body() d: CadastroDto) { return this.auth.cadastrar(d); }

  @Post('login') @HttpCode(200)
  login(@Body() d: LoginDto, @Ip() ip: string) { return this.auth.login(d, ip); }

  @Post('refresh') @HttpCode(200)
  refresh(@Body() d: RefreshDto) { return this.auth.refresh(d.refreshToken); }

  @Post('esqueci-senha') @HttpCode(200)
  esqueci(@Body() d: EsqueciSenhaDto) { return this.auth.esqueciSenha(d.email); }

  @Post('redefinir-senha') @HttpCode(200)
  redefinir(@Body() d: RedefinirSenhaDto) { return this.auth.redefinirSenha(d); }

  @UseGuards(JwtAuthGuard) @Post('logout') @HttpCode(204)
  logout(@Req() req: any, @Body() d: Partial<RefreshDto>) {
    return this.auth.logout(req.user.id, req.user.jti, req.user.exp, d.refreshToken);
  }

  @UseGuards(JwtAuthGuard) @Patch('biometria')
  biometria(@Req() req: any, @Body() d: BiometriaDto) {
    return this.auth.definirBiometria(req.user.id, d.ativa);
  }
}
