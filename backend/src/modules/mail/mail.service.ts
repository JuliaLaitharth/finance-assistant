import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private logger = new Logger(MailService.name);
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  async enviarRecuperacao(email: string, token: string) {
    const link = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}`;
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Recuperação de senha',
        html: `<p>Clique para redefinir sua senha (válido por 30 min):</p>
               <p><a href="${link}">${link}</a></p>`,
      });
      this.logger.log(`E-mail de recuperação enviado para ${email}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Falha ao enviar e-mail: ${msg}`);
    }
  }
}
