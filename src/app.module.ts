import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SpiderModule } from './spider/spider.module';

@Module({
  imports: [SpiderModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
