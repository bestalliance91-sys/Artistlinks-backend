import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/message.dto';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  send(@CurrentUser() user: any, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(user.id, dto);
  }

  @Get('conversations')
  getConversations(@CurrentUser() user: any) {
    return this.messagesService.getConversations(user.id);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: any) {
    return this.messagesService.getUnreadCount(user.id);
  }

  @Get(':otherUserId')
  getConversation(@CurrentUser() user: any, @Param('otherUserId') otherUserId: string) {
    return this.messagesService.getConversation(user.id, otherUserId);
  }
}
