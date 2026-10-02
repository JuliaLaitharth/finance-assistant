import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ConsentimentosModule } from './modules/consentimentos/consentimentos.module';
import { ContasModule } from './modules/contas/contas.module';
import { TransacoesModule } from './modules/transacoes/transacoes.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { AlertasModule } from './modules/alertas/alertas.module';
import { NotificacoesModule } from './modules/notificacoes/notificacoes.module';
import { AlexaModule } from './modules/alexa/alexa.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { PluggyModule } from './modules/pluggy/pluggy.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),
    AuthModule,
    UsuariosModule,
    ConsentimentosModule,
    ContasModule,
    TransacoesModule,
    CategoriasModule,
    AlertasModule,
    NotificacoesModule,
    AlexaModule,
    AuditoriaModule,
    PluggyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
