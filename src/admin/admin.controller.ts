import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAllUsers(Number(page) || 1, Number(limit) || 50);
  }

  @Patch('users/:id/active')
  toggleActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.adminService.toggleUserActive(id, isActive);
  }

  @Patch('users/:id/verify')
  verify(@Param('id') id: string) {
    return this.adminService.verifyUser(id);
  }
}
