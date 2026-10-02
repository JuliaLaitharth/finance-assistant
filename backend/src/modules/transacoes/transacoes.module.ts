import { Module } from '@nestjs/common';
import { TransacoesController } from './transacoes.controller';
import { TransacoesService } from './transacoes.service';

@Module({
  controllers: [TransacoesController],
  providers: [TransacoesService]
})
export class TransacoesModule {}
