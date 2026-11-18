import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// passport-jwt does not provide TypeScript declarations in this project.
// @ts-ignore
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET || 'access_secret',
    });
  }

  async validate(payload: any) {
    const resolvedId = payload.sub ?? payload.customer_id ?? payload.id;
    return {
      userId: resolvedId,
      id: resolvedId,
      customer_id: payload.customer_id ?? resolvedId,
      username: payload.username,
      email: payload.email,
      role: payload.role || payload.userType,
    };
  }
}