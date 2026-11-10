import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CustomerService } from '../Customer/customer.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private customerService: CustomerService,
    private jwtService: JwtService,
  ) {}

  // Validate Admin/Staff User (users table)
  async validateUser(username: string, pass: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;
    const valid = await bcrypt.compare(pass, user.password);
    if (valid) return { id: user.id, username: user.username, role: user.role, type: 'admin' };
    return null;
  }

  // Validate Customer (customer table)
  async validateCustomer(email: string, pass: string) {
    // Requires findByEmail in CustomerService
    const customer = await (this.customerService as any).findByEmail(email);
    if (!customer) return null;
    const valid = await bcrypt.compare(pass, customer.password);
    if (valid) {
      return {
        id: customer.customer_id,
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`,
        role: 'customer',
        type: 'customer',
      };
    }
    return null;
  }

  // Generate tokens for either Admin/Staff or Customer
  async login(user: { id: number; username?: string; email?: string; role: string; type?: string }) {
    const payload = {
      sub: user.id,
      username: user.username || user.email,
      role: user.role,
      type: user.type || (user.role === 'customer' ? 'customer' : 'admin'),
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret',
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' } as jwt.SignOptions,
    );

    // Save refresh token according to user type
    if (payload.type === 'admin') {
      await this.usersService.setRefreshToken(user.id, refreshToken);
    }

    return { accessToken, refreshToken, userType: payload.type, role: payload.role };
  }

  async logout(userId: number, userType: 'admin' | 'customer' = 'admin') {
    if (userType === 'admin') {
      await this.usersService.setRefreshToken(userId, null);
    }
    return { ok: true };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const decoded: any = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret',
      );

      const isCustomer = decoded.type === 'customer';

      let userFound: any = null;
      if (isCustomer) {
        userFound = await this.customerService.findById(decoded.sub);
      } else {
        userFound = await this.usersService.findByRefreshToken(refreshToken);
      }

      if (!userFound) throw new UnauthorizedException('Invalid refresh token');

      const payload = {
        sub: decoded.sub,
        username: decoded.username,
        role: decoded.role,
        type: decoded.type,
      };

      const accessToken = this.jwtService.sign(payload);
      const newRefresh = jwt.sign(
        payload,
        process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret',
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' } as jwt.SignOptions,
      );

      if (!isCustomer) {
        await this.usersService.setRefreshToken(decoded.sub, newRefresh);
      }

      return { accessToken, refreshToken: newRefresh };
    } catch (err) {
      throw new UnauthorizedException('Could not refresh tokens');
    }
  }
}