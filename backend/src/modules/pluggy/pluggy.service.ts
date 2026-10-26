import { BadGatewayException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';

const API = 'https://api.pluggy.ai';

@Injectable()
export class PluggyService {
  constructor(private prisma: PrismaService, @Inject('REDIS') private redis: Redis) {}

  private async apiKey(): Promise<string> {
    const cache = await this.redis.get('pluggy:apiKey');
    if (cache) return cache;
    const r = await fetch(`${API}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: process.env.PLUGGY_CLIENT_ID,
        clientSecret: process.env.PLUGGY_CLIENT_SECRET,
      }),
    });
    if (!r.ok) throw new BadGatewayException('Falha ao autenticar na Pluggy');
    const { apiKey } = await r.json();
    await this.redis.set('pluggy:apiKey', apiKey, 'EX', 60 * 110); // expira em 2h
    return apiKey;
  }

  private async req<T = any>(path: string, init: RequestInit = {}): Promise<T> {
    const r = await fetch(`${API}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': await this.apiKey(), ...init.headers },
    });
    if (!r.ok) throw new BadGatewayException(`Pluggy ${r.status}: ${await r.text()}`);
    return r.json();
  }

  async connectToken(itemId?: string) {
    const { accessToken } = await this.req('/connect_token', {
      method: 'POST',
      body: JSON.stringify(itemId ? { itemId } : {}),
    });
    return { accessToken };
  }

  async registrarItem(usuarioId: number, itemId: string) {
    const existente = await this.prisma.consentimento.findUnique({ where: { itemIdPluggy: itemId } });
    if (existente && existente.usuarioId !== usuarioId) throw new ForbiddenException();

    const item = await this.req(`/items/${itemId}`);
    const inst = await this.prisma.instituicao.upsert({
      where: { codigoPluggy: String(item.connector.id) },
      update: { nome: item.connector.name, logoUrl: item.connector.imageUrl },
      create: { codigoPluggy: String(item.connector.id), nome: item.connector.name, logoUrl: item.connector.imageUrl },
    });
    const c = await this.prisma.consentimento.upsert({
      where: { itemIdPluggy: itemId },
      update: { status: item.status, dataRevogacao: null },
      create: { usuarioId, instituicaoId: inst.id, itemIdPluggy: itemId, status: item.status },
    });
    await this.sincronizar(usuarioId, c.id);
    return c;
  }

  async sincronizar(usuarioId: number, consentimentoId: number) {
    const c = await this.prisma.consentimento.findFirst({ where: { id: consentimentoId, usuarioId } });
    if (!c) throw new NotFoundException('Consentimento não encontrado');

    const { results: contas } = await this.req(`/accounts?itemId=${c.itemIdPluggy}`);
    const desde = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);

    for (const a of contas) {
      const conta = await this.prisma.contaBancaria.upsert({
        where: { idExternoPluggy: a.id },
        update: { saldoAtual: a.balance, ultimaSincronizacao: new Date() },
        create: {
          consentimentoId: c.id, idExternoPluggy: a.id, tipo: a.type,
          numeroMascarado: `****${String(a.number ?? '').slice(-4)}`,
          saldoAtual: a.balance, moeda: a.currencyCode ?? 'BRL', ultimaSincronizacao: new Date(),
        },
      });

      let page = 1, total = 1;
      do {
        const r = await this.req(`/transactions?accountId=${a.id}&from=${desde}&pageSize=500&page=${page}`);
        total = r.totalPages;
        for (const t of r.results) {
          await this.prisma.transacao.upsert({
            where: { idExternoPluggy: t.id },
            update: { descricao: t.description, valor: t.amount },
            create: {
              contaId: conta.id, idExternoPluggy: t.id, descricao: t.description,
              valor: t.amount, tipo: t.type, data: new Date(t.date),
              metodoPagamento: t.paymentData?.paymentMethod ?? null,
            },
          });
        }
      } while (++page <= total);
    }
    return { contas: contas.length };
  }

  contas(usuarioId: number) {
    return this.prisma.contaBancaria.findMany({
      where: { consentimento: { usuarioId, dataRevogacao: null } },
      include: { consentimento: { include: { instituicao: true } } },
    });
  }

  transacoes(usuarioId: number, limite = 50) {
    return this.prisma.transacao.findMany({
      where: { conta: { consentimento: { usuarioId } } },
      orderBy: { data: 'desc' },
      take: Math.min(limite, 200),
      include: { categoria: true },
    });
  }
}
