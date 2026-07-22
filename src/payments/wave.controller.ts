import { Controller, Post, Body, Headers, HttpCode, Logger } from '@nestjs/common';
import { WaveService } from './wave.service';

@Controller('payments/wave')
export class WaveController {
  private readonly logger = new Logger(WaveController.name);

  constructor(private waveService: WaveService) {}

  @Post('checkout')
  async createCheckout(@Body() body: { amount: number; reference: string }) {
    return this.waveService.createCheckoutSession(body.amount, body.reference);
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Body() body: any, @Headers('wave-signature') signature: string) {
    this.logger.log(`Webhook reçu: ${body.type}`);

    if (body.type === 'checkout.session.completed') {
      const { id, client_reference, payment_status, amount, transaction_id } = body.data;
      this.logger.log(`Paiement ${payment_status} pour ref=${client_reference} montant=${amount} tx=${transaction_id}`);
      // TODO: mettre à jour le statut de la commande/abonnement en DB via client_reference
    }

    return { received: true };
  }
}
