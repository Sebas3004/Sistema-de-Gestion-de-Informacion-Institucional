import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { compare } from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleName, User } from './entities';

export const Roles=(...roles:RoleName[])=>SetMetadata('roles',roles);

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private users:Repository<User>, private jwt:JwtService){}
  async login(email:string,password:string){
    const user=await this.users.createQueryBuilder('u').addSelect('u.passwordHash').leftJoinAndSelect('u.roles','roles').where('LOWER(u.email)=LOWER(:email)',{email}).getOne();
    if(!user || !user.active || !(await compare(password,user.passwordHash))) throw new UnauthorizedException('Credenciales inválidas');
    const payload={sub:user.id,email:user.email,roles:user.roles.map(r=>r.name)};
    return {accessToken:await this.jwt.signAsync(payload),user:{id:user.id,name:user.name,email:user.email,position:user.position,roles:user.roles.map(r=>r.name)}};
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt:JwtService){}
  async canActivate(ctx:ExecutionContext){
    const req=ctx.switchToHttp().getRequest();
    const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'');
    if(!token) throw new UnauthorizedException();
    try{ req.user=await this.jwt.verifyAsync(token); return true; } catch{ throw new UnauthorizedException(); }
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector:Reflector){}
  canActivate(ctx:ExecutionContext){
    const roles=this.reflector.getAllAndOverride<RoleName[]>('roles',[ctx.getHandler(),ctx.getClass()]);
    if(!roles?.length) return true;
    const user=ctx.switchToHttp().getRequest().user;
    if(!roles.some(r=>user?.roles?.includes(r))) throw new ForbiddenException('No autorizado');
    return true;
  }
}
