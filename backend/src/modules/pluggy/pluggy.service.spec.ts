import { Test, TestingModule } from '@nestjs/testing';
import { PluggyService } from './pluggy.service';

describe('PluggyService', () => {
  let service: PluggyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PluggyService],
    }).compile();

    service = module.get<PluggyService>(PluggyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
