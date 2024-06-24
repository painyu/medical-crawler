import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SpiderModule } from './spider/spider.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [SpiderModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
