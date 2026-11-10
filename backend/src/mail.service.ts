import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  ConfigService,
} from '@nestjs/config';

import * as nodemailer from 'nodemailer';

import {
  News,
  User,
} from './entities';

@Injectable()
export class MailService {
  private readonly logger =
    new Logger(MailService.name);

  constructor(
    private readonly config:
      ConfigService,
  ) {}

  private isEnabled() {
    return String(
      this.config.get(
        'MAIL_ENABLED',
        'false',
      ),
    )
      .trim()
      .toLowerCase() === 'true';
  }

  private escapeHtml(
    value: any,
  ) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private createTransporter() {
    const host =
      this.config.get<string>(
        'MAIL_HOST',
      );

    const port =
      Number(
        this.config.get(
          'MAIL_PORT',
          587,
        ),
      );

    const secure =
      String(
        this.config.get(
          'MAIL_SECURE',
          'false',
        ),
      )
        .trim()
        .toLowerCase() === 'true';

    const user =
      this.config.get<string>(
        'MAIL_USER',
      );

    const pass =
      this.config.get<string>(
        'MAIL_PASSWORD',
      );

    if (!host) {
      throw new Error(
        'MAIL_HOST no está configurado',
      );
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth:
        user && pass
          ? {
              user,
              pass,
            }
          : undefined,
    });
  }

  async sendNewsAlert(
    news: News,
    recipients: User[],
  ) {
    const emails =
      Array.from(
        new Set(
          recipients
            .map((user) =>
              String(
                user.email || '',
              )
                .trim()
                .toLowerCase(),
            )
            .filter(Boolean),
        ),
      );

    if (!emails.length) {
      this.logger.log(
        `La noticia "${news.title}" no tiene destinatarios para correo`,
      );

      return {
        sent: false,
        skipped: true,
        reason:
          'Sin destinatarios',
        recipients: 0,
      };
    }

    if (!this.isEnabled()) {
      this.logger.log(
        `MAIL_ENABLED=false. Se omitió el envío de "${news.title}" a ${emails.length} destinatario(s)`,
      );

      return {
        sent: false,
        skipped: true,
        reason:
          'Correo deshabilitado',
        recipients:
          emails.length,
      };
    }

    try {
      const transporter =
        this.createTransporter();

      const from =
        this.config.get<string>(
          'MAIL_FROM',
        ) ||
        this.config.get<string>(
          'MAIL_USER',
        );

      if (!from) {
        throw new Error(
          'MAIL_FROM o MAIL_USER debe estar configurado',
        );
      }

      const appUrl =
        this.config.get<string>(
          'APP_URL',
          'http://localhost:5173',
        );

      const title =
        this.escapeHtml(
          news.title,
        );

      const summary =
        this.escapeHtml(
          news.summary,
        );

      const category =
        this.escapeHtml(
          news.category,
        );

      const priority =
        this.escapeHtml(
          news.priority,
        );

      const target =
        this.escapeHtml(
          news.targetArea,
        );

      await transporter.sendMail({
        from,
        to: from,
        bcc: emails,
        subject:
          `[TEC San José] ${news.title}`,
        text:
          [
            'Campus Tecnológico de San José',
            '',
            `Nueva noticia institucional: ${news.title}`,
            `Categoría: ${news.category}`,
            `Prioridad: ${news.priority}`,
            `Público: ${news.targetArea}`,
            '',
            news.summary,
            '',
            `Consulte el sistema: ${appUrl}/noticias`,
          ].join('\n'),
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
            <h2>Campus Tecnológico de San José</h2>
            <h3>${title}</h3>

            <p>
              <strong>Categoría:</strong> ${category}<br />
              <strong>Prioridad:</strong> ${priority}<br />
              <strong>Público:</strong> ${target}
            </p>

            <p>${summary}</p>

            <p>
              <a href="${this.escapeHtml(appUrl)}/noticias">
                Consultar noticia en el sistema
              </a>
            </p>
          </div>
        `,
      });

      this.logger.log(
        `Alerta enviada para "${news.title}" a ${emails.length} destinatario(s)`,
      );

      return {
        sent: true,
        skipped: false,
        recipients:
          emails.length,
      };
    } catch (error: any) {
      this.logger.error(
        `No se pudo enviar la alerta de "${news.title}": ${error?.message || error}`,
      );

      return {
        sent: false,
        skipped: false,
        recipients:
          emails.length,
        error:
          error?.message ||
          'Error enviando correo',
      };
    }
  }
}
