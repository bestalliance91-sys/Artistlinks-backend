import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'ArtistLinks Backend', timestamp: new Date().toISOString() };

  @Get('debug-ip')
  async debugIp() {
    const v4 = await fetch('https://api.ipify.org?format=json').then(r => r.json()).catch(e => ({ error: e.message }));
    const v6 = await fetch('https://api6.ipify.org?format=json').then(r => r.json()).catch(e => ({ error: e.message }));
    return { ipv4: v4, ipv6: v6 };
  }
  }
}
