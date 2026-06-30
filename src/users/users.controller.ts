import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto, SearchProfilesDto } from './dto/profile.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  getMyProfile(@CurrentUser() user: any) {
    return this.usersService.getProfileByUserId(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateMyProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('search')
  search(@Query() dto: SearchProfilesDto, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.usersService.searchProfiles(dto, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':profileId')
  getPublicProfile(@Param('profileId') profileId: string) {
    return this.usersService.getPublicProfile(profileId);
  }
}
