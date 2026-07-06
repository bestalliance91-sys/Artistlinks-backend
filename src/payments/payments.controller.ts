import { Controller, Post, Get, Body, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('initiate')
  initiate(@CurrentUser() user: any, @Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(user.id, dto);
  }

  // Endpoint public appelé par les serveurs CinetPay - ne pas protéger par JWT
  @Post('cinetpay/notify')
  @HttpCode(200)
  handleNotification(@Body() body: any) {
    return this.paymentsService.handleNotification(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyPayments(@CurrentUser() user: any) {
    return this.paymentsService.getMyPayments(user.id);
  }
}
