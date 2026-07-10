import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const maxRetries = 5;
    const delayMs = 3000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Connexion à la base de données réussie');
        return;
      } catch (error) {
        this.logger.warn(
          `Tentative de connexion DB ${attempt}/${maxRetries} échouée: ${error.message}`,
        );
        if (attempt === maxRetries) {
          this.logger.error('Échec de connexion à la base après plusieurs tentatives');
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
