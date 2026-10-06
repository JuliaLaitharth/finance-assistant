import { Inject, Injectable, ConflictException, UnauthorizedException,
  ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { v4 as uuid } from 'uuid';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CadastroDto, LoginDto, RedefinirSenhaDto } from './dto/auth.dto';

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MIN = 15;
const RECUPERACAO_MIN = 30;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
    @Inject('REDIS') private redis: Redis,
  ) {}

  async cadastrar(dto: CadastroDto) {
    const email = dto.email.toLowerCase();
    if (await this.prisma.usuario.findUnique({ where: { email } }))
      throw new ConflictException('E-mail já cadastrado');
    const u = await this.prisma.usuario.create({
      data: { nome: dto.nome, email, senhaHash: await bcrypt.hash(dto.senha, 12) },
    });
    await this.auditar(u.id, 'CADASTRO');
    return { id: u.id, nome: u.nome, email: u.email };
  }

  async login(dto: LoginDto, ip?: string) {
    const u = await this.prisma.usuario.findUnique({ where: { email: dto.email.toLowerCase() } });
    const erro = new UnauthorizedException('E-mail ou senha inválidos');
    if (!u) throw erro;

    if (u.bloqueadoAte && u.bloqueadoAte > new Date()) {
      const min = Math.ceil((u.bloqueadoAte.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(`Conta bloqueada. Tente em ${min} min`);
    }

    if (!(await bcrypt.compare(dto.senha, u.senhaHash))) {
      const tentativas = u.tentativasFalhas + 1;
      const bloquear = tentativas >= MAX_TENTATIVAS;
      await this.prisma.usuario.update({
        where: { id: u.id },
        data: {
          tentativasFalhas: bloquear ? 0 : tentativas,
          bloqueadoAte: bloquear ? new Date(Date.now() + BLOQUEIO_MIN * 60000) : null,
        },
      });
      await this.auditar(u.id, bloquear ? 'BLOQUEIO' : 'LOGIN_FALHA', ip);
      if (bloquear) throw new ForbiddenException(`Conta bloqueada por ${BLOQUEIO_MIN} min`);
      throw erro;
    }

    await this.prisma.usuario.update({
      where: { id: u.id },
      data: { tentativasFalhas: 0, bloqueadoAte: null, ultimoLogin: new Date() },
    });
    await this.auditar(u.id, 'LOGIN', ip);
    return {
      ...(await this.gerarTokens(u.id, u.email)),
      usuario: { id: u.id, nome: u.nome, email: u.email, biometriaAtiva: u.biometriaAtiva },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const p = await this.jwt.verifyAsync(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
      if (p.tipo !== 'refresh' || (await this.redis.exists(`bl:${p.jti}`))) throw new Error();
      await this.revogar(p.jti, p.exp);
      return this.gerarTokens(p.sub, p.email);
    } catch {
      throw new UnauthorizedException('Sessão expirada');
    }
  }

  async logout(userId: number, accessJti: string, accessExp: number, refreshToken?: string) {
    await this.revogar(accessJti, accessExp);
    if (refreshToken) {
      const p = this.jwt.decode(refreshToken) as any;
      if (p?.jti) await this.revogar(p.jti, p.exp);
    }
    await this.auditar(userId, 'LOGOUT');
  }

  async esqueciSenha(email: string) {
    const u = await this.prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
    if (u) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.tokenRecuperacao.updateMany({
        where: { usuarioId: u.id, usado: false }, data: { usado: true },
      });
      await this.prisma.tokenRecuperacao.create({
        data: {
          usuarioId: u.id,
          token: this.hash(token),
          expiraEm: new Date(Date.now() + RECUPERACAO_MIN * 60000),
        },
      });

      await this.mail.enviarRecuperacao(u.email, token);
      if (process.env.NODE_ENV !== 'production')
        console.log(`[DEV] Token de ${u.email}: ${token}`);

      await this.auditar(u.id, 'RECUPERACAO_SOLICITADA');
    }
    return { mensagem: 'Se o e-mail existir, enviaremos as instruções.' };
  }

  async redefinirSenha(dto: RedefinirSenhaDto) {
    const t = await this.prisma.tokenRecuperacao.findUnique({ where: { token: this.hash(dto.token) } });
    if (!t || t.usado || t.expiraEm < new Date())
      throw new BadRequestException('Token inválido ou expirado');

    await this.prisma.$transaction([
      this.prisma.tokenRecuperacao.update({ where: { id: t.id }, data: { usado: true } }),
      this.prisma.usuario.update({
        where: { id: t.usuarioId },
        data: { senhaHash: await bcrypt.hash(dto.novaSenha, 12), tentativasFalhas: 0, bloqueadoAte: null },
      }),
    ]);
    await this.auditar(t.usuarioId, 'SENHA_REDEFINIDA');
    return { mensagem: 'Senha alterada com sucesso' };
  }

  async definirBiometria(userId: number, ativa: boolean) {
    await this.prisma.usuario.update({ where: { id: userId }, data: { biometriaAtiva: ativa } });
    await this.auditar(userId, ativa ? 'BIOMETRIA_ATIVADA' : 'BIOMETRIA_DESATIVADA');
    return { biometriaAtiva: ativa };
  }

  // ---------- auxiliares ----------
  private async gerarTokens(sub: number, email: string) {
    const accessToken = await this.jwt.signAsync(
      { sub, email, tipo: 'access', jti: uuid() },
      { secret: process.env.JWT_SECRET, expiresIn: '15m' },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub, email, tipo: 'refresh', jti: uuid() },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }

  private async revogar(jti: string, exp: number) {
    const ttl = exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) await this.redis.set(`bl:${jti}`, '1', 'EX', ttl);
  }

  private hash(v: string) { return createHash('sha256').update(v).digest('hex'); }

  private auditar(usuarioId: number, acao: string, ip?: string) {
    return this.prisma.logAuditoria.create({ data: { usuarioId, acao, recurso: 'auth', ip } });
  }
}
