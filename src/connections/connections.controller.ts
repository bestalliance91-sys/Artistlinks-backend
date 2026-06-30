import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto } from './dto/connection.dto';

@UseGuards(JwtAuthGuard)
@Controller('connections')
export class ConnectionsController {
  constructor(private connectionsService: ConnectionsService) {}

  @Post()
  send(@CurrentUser() user: any, @Body() dto: CreateConnectionDto) {
    return this.connectionsService.sendRequest(user.id, dto);
  }

  @Patch(':id/accept')
  accept(@CurrentUser() user: any, @Param('id') id: string) {
    return this.connectionsService.respondToRequest(user.id, id, true);
  }

  @Patch(':id/reject')
  reject(@CurrentUser() user: any, @Param('id') id: string) {
    return this.connectionsService.respondToRequest(user.id, id, false);
  }

  @Get()
  getMine(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.connectionsService.getMyConnections(user.id, status);
  }

  @Get('pending')
  getPending(@CurrentUser() user: any) {
    return this.connectionsService.getPendingRequests(user.id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.connectionsService.removeConnection(user.id, id);
  }
}
