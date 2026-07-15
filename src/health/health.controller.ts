import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ip')
  async getOutboundIp() {
    const response = await fetch('https://ifconfig.me/ip');
    const ip = await response.text();
    return { outboundIp: ip.trim() };
  }
}
