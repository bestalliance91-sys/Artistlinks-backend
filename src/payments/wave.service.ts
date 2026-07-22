import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WaveService {
  private readonly logger = new Logger(WaveService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('WAVE_API_KEY');
    this.baseUrl = this.config.get<string>('WAVE_API_BASE_URL');
  }

  async createCheckoutSession(amount: number, clientReference: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/checkout/sessions`,
        {
          amount: amount.toString(),
          currency: 'XOF',
          client_reference: clientReference,
          success_url: this.config.get('WAVE_SUCCESS_URL'),
          error_url: this.config.get('WAVE_ERROR_URL'),
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (err) {
      this.logger.error('Wave checkout session creation failed', err.response?.data || err.message);
      throw new BadRequestException('Impossible de créer la session de paiement Wave');
    }
  }
}
