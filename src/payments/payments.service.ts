import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto, CinetPayNotificationDto } from './dto/payment.dto';
import { getPricingForTier, calculateCommission } from './pricing.config';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly apiKey: string;
  private readonly siteId: string;
  private readonly baseUrl = 'https://api-checkout.cinetpay.com/v2';

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('CINETPAY_API_KEY') || '';
    this.siteId = this.config.get<string>('CINETPAY_SITE_ID') || '';
  }

  async initiatePayment(userId: string, dto: InitiatePaymentDto) {
    const pricing = getPricingForTier(dto.tier);
    if (pricing.amount === 0) {
      throw new BadRequestException("Le palier gratuit ne nécessite pas de paiement");
    }

    const transactionId = `AL-${uuidv4()}`;
    const commissionAmount = calculateCommission(pricing.amount, dto.tier);

    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });

    const payload = {
      apikey: this.apiKey,
      site_id: this.siteId,
      transaction_id: transactionId,
      amount: pricing.amount,
      currency: 'XOF',
      description: `Abonnement ArtistLinks ${dto.tier}`,
      customer_name: user?.profile?.fullName || 'Utilisateur',
      customer_email: user?.email,
      customer_phone_number: dto.phoneNumber,
      notify_url: this.config.get<string>('CINETPAY_NOTIFY_URL'),
      return_url: this.config.get<string>('CINETPAY_RETURN_URL'),
      channels: 'MOBILE_MONEY',
      lang: 'fr',
    };

    try {
      const response = await axios.post(`${this.baseUrl}/payment`, payload);

      await this.prisma.payment.create({
        data: {
          userId,
          transactionId,
          amount: pricing.amount,
          currency: 'XOF',
          method: 'ORANGE_MONEY', // valeur par défaut, mise à jour via webhook
          status: 'PENDING',
          subscriptionTier: dto.tier,
          commissionAmount,
          cinetpayPaymentToken: response.data?.data?.payment_token,
          rawResponse: response.data,
        },
      });

      return {
        paymentUrl: response.data?.data?.payment_url,
        transactionId,
      };
    } catch (error) {
      this.logger.error('Erreur initiation paiement CinetPay', error?.response?.data || error.message);
      throw new BadRequestException("Échec de l'initiation du paiement");
    }
  }

  // Webhook appelé par CinetPay pour confirmer le statut réel d'un paiement
  async handleNotification(dto: CinetPayNotificationDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { transactionId: dto.cpm_trans_id },
    });
    if (!payment) {
      this.logger.warn(`Notification reçue pour transaction inconnue: ${dto.cpm_trans_id}`);
      return { status: 'ignored' };
    }

    // Vérification du statut réel auprès de CinetPay (ne jamais faire confiance au webhook seul)
    const verification = await this.verifyTransaction(dto.cpm_trans_id);

    const isSuccess = verification?.data?.status === 'ACCEPTED';

    await this.prisma.payment.update({
      where: { transactionId: dto.cpm_trans_id },
      data: {
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        method: this.mapPaymentMethod(dto.payment_method),
        rawResponse: verification?.data,
      },
    });

    if (isSuccess) {
      await this.prisma.user.update({
        where: { id: payment.userId },
        data: { subscriptionTier: payment.subscriptionTier },
      });
    }

    return { status: 'processed', success: isSuccess };
  }

  private async verifyTransaction(transactionId: string) {
    const response = await axios.post(`${this.baseUrl}/payment/check`, {
      apikey: this.apiKey,
      site_id: this.siteId,
      transaction_id: transactionId,
    });
    return response.data;
  }

  private mapPaymentMethod(method: string): any {
    const map: Record<string, string> = {
      OM: 'ORANGE_MONEY',
      MOMO: 'MTN_MOMO',
      MOOV: 'MOOV_MONEY',
      WAVE: 'WAVE',
      CARD: 'CARD',
    };
    return map[method] || 'ORANGE_MONEY';
  }

  async getMyPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
