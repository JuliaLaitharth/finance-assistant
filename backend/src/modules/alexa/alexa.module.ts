import { Module } from '@nestjs/common';
import { AlexaController } from './alexa.controller';
import { AlexaService } from './alexa.service';

@Module({
  controllers: [AlexaController],
  providers: [AlexaService]
})
export class AlexaModule {}
