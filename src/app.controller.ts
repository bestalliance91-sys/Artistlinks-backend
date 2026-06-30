import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'ArtistLinks Backend', timestamp: new Date().toISOString() };
  }
}
