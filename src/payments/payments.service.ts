import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CinetPayClient, parseNotification } from 'cinetpay-js';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto, CinetPayNotificationDto } from './dto/payment.dto';
import { getPricingForTier, calculateCommission } from './pricing.config';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private client: CinetPayClient;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.client = new CinetPayClient({
      credentials: {
        CI: {
          apiKey: this.config.get<string>('CINETPAY_API_KEY_CI') || '',
          apiPassword: this.config.get<string>('CINETPAY_API_PASSWORD_CI') || '',
        },
      },
    });
  }

  async initiatePayment(userId: string, dto: InitiatePaymentDto) {
    const pricing = getPricingForTier(dto.tier);
    if (pricing.amount === 0) {
      throw new BadRequestException("Le palier gratuit ne nécessite pas de paiement");
    }

    const transactionId = `AL-${uuidv4()}`;
    const commissionAmount = calculateCommission(pricing.amount, dto.tier);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    try {
      const payment = await this.client.payment.initialize({
        currency: 'XOF',
        merchantTransactionId: transactionId,
        amount: pricing.amount,
        lang: 'fr',
        designation: `Abonnement ArtistLinks ${dto.tier}`,
        clientEmail: user?.email || '',
        clientFirstName: user?.profile?.fullName?.split(' ')[0] || 'Utilisateur',
        clientLastName: user?.profile?.fullName?.split(' ').slice(1).join(' ') || 'ArtistLinks',
        clientPhoneNumber: dto.phoneNumber,
        successUrl: this.config.get<string>('CINETPAY_RETURN_URL') || '',
        failedUrl: this.config.get<string>('CINETPAY_RETURN_URL') || '',
        notifyUrl: this.config.get<string>('CINETPAY_NOTIFY_URL') || '',
        channel: 'PUSH',
      }, 'CI');

      await this.prisma.payment.create({
        data: {
          userId,
          transactionId,
          amount: pricing.amount,
          currency: 'XOF',
          method: 'ORANGE_MONEY',
          status: 'PENDING',
          subscriptionTier: dto.tier,
          commissionAmount,
          // TODO: vérifier le nom exact du champ token dans la réponse (console.log(payment) au 1er test)
          cinetpayPaymentToken: (payment as any)?.paymentToken ?? null,
          rawResponse: payment as any,
        },
      });

      return {
        // TODO: vérifier le nom exact du champ URL dans la réponse (console.log(payment) au 1er test)
        paymentUrl: (payment as any)?.paymentUrl ?? (payment as any)?.details?.paymentUrl,
        transactionId,
      };
    } catch (error: any) {
      this.logger.error('Erreur initiation paiement CinetPay', error?.message || error);
      throw new BadRequestException("Échec de l'initiation du paiement");
    }
  }

  // Webhook appelé par CinetPay pour confirmer le statut réel d'un paiement
  async handleNotification(rawBody: any) {
    const notification = parseNotification(rawBody) as any;

    const payment = await this.prisma.payment.findUnique({
      where: { transactionId: notification.merchantTransactionId },
    });

    if (!payment) {
      this.logger.warn(`Notification reçue pour transaction inconnue: ${notification.merchantTransactionId}`);
      return { status: 'ignored' };
    }

    // Vérification du statut réel auprès de CinetPay (ne jamais faire confiance au webhook seul)
    const statusResult = await this.client.payment.getStatus(notification.transactionId, 'CI');
    const isSuccess = (statusResult as any)?.status === 'SUCCESS';

    await this.prisma.payment.update({
      where: { transactionId: notification.merchantTransactionId },
      data: {
        status: isSuccess ? 'SUCCESS' : 'FAILED',
        rawResponse: statusResult as any,
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

  async getMyPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
