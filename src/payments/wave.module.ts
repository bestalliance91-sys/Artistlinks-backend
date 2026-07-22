import { Module } from '@nestjs/common';
import { WaveService } from './wave.service';
import { WaveController } from './wave.controller';

@Module({
  controllers: [WaveController],
  providers: [WaveService],
  exports: [WaveService],
})
export class WaveModule {}
