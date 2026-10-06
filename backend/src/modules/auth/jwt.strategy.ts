import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import Redis from 'ioredis';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject('REDIS') private redis: Redis) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(p: any) {
    if (p.tipo !== 'access' || (await this.redis.exists(`bl:${p.jti}`)))
      throw new UnauthorizedException();
    return { id: p.sub, email: p.email, jti: p.jti, exp: p.exp };
  }
}
