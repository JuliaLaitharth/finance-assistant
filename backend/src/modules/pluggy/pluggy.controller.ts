import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PluggyService } from './pluggy.service';
import { ConnectTokenDto, ItemDto } from './dto/pluggy.dto';

@Controller('pluggy')
@UseGuards(JwtAuthGuard)
export class PluggyController {
  constructor(private pluggy: PluggyService) {}

  @Post('connect-token')
  token(@Body() d: ConnectTokenDto) { return this.pluggy.connectToken(d.itemId); }

  @Post('items')
  registrar(@Req() req: any, @Body() d: ItemDto) { return this.pluggy.registrarItem(req.user.id, d.itemId); }

  @Post('consentimentos/:id/sync')
  sync(@Req() req: any, @Param('id', ParseIntPipe) id: number) { return this.pluggy.sincronizar(req.user.id, id); }

  @Get('contas')
  contas(@Req() req: any) { return this.pluggy.contas(req.user.id); }

  @Get('transacoes')
  transacoes(@Req() req: any, @Query('limite') limite?: string) {
    return this.pluggy.transacoes(req.user.id, Number(limite) || 50);
  }
}
