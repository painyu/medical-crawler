import { Module } from '@nestjs/common';
import { SpiderController } from './spider.controller';
import { SpiderService } from './spider.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  exports: [SpiderService],
  controllers: [SpiderController],
  providers: [SpiderService],
})
export class SpiderModule { }
