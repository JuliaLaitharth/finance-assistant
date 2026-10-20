import { Test, TestingModule } from '@nestjs/testing';
import { PluggyController } from './pluggy.controller';

describe('PluggyController', () => {
  let controller: PluggyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PluggyController],
    }).compile();

    controller = module.get<PluggyController>(PluggyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
