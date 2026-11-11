import { 
  Controller, 
  Post, 
  Body, 
  UnauthorizedException, 
  BadRequestException 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService, 
    private usersService: UsersService
  ) {}

  // ---------------- ADMIN / STAFF ENDPOINTS ---------------- //

  @Post('register')
  async registerAdmin(@Body() body: { username: string; password: string }) {
    if (!body.username || !body.password) {
      throw new BadRequestException('Username and password are required');
    }
    return this.usersService.createUser(body.username, body.password);
  }

  @Post('login')
  @Post('admin/login')
  async adminLogin(@Body() body: { username: string; password: string }) {
    if (!body.username || !body.password) {
      throw new BadRequestException('Username and password are required');
    }

    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  // ---------------- CUSTOMER ENDPOINTS ---------------- //

  @Post('customer/login')
  async customerLogin(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }

    const customer = await this.authService.validateCustomer(body.email, body.password);
    if (!customer) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(customer);
  }

  // ---------------- SHARED SESSION ENDPOINTS ---------------- //

  @Post('logout')
  async logout(@Body() body: { userId: number; userType?: 'admin' | 'customer' }) {
    if (!body.userId) {
      throw new BadRequestException('User ID is required');
    }
    return this.authService.logout(body.userId, body.userType || 'admin');
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.refreshTokens(body.refreshToken);
  }
}