import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        super();
    }
    async onModuleInit() {
        await this.$connect(); // 在模块初始化时连接到数据库
    }

    async onApplicationShutdown() {
        await this.$disconnect(); // 在应用程序关闭时断开与数据库的连接
    }
}
