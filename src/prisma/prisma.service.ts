import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    // En v6 ya no necesitas llamar a this.$connect()
    // El cliente se conecta automáticamente on-demand
  }

  async onModuleDestroy(): Promise<void> {
    // En v6 ya no existe $disconnect()
    // Prisma maneja el cierre internamente
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    // En v6 tampoco existe $on('beforeExit')
    // Si quieres cerrar la app, lo puedes hacer directamente
    app.enableShutdownHooks();
  }
}
