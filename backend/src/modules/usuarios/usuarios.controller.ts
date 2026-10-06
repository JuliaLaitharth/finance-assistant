import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private usuarios: UsuariosService) {}

  @Get('me')
  me(@Req() req: any) {
    // Funciona se o validate() da strategy retornar { id } ou o payload { sub }
    const id = Number(req.user.id ?? req.user.sub);
    return this.usuarios.me(id);
  }
}
