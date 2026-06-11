// src/shared/infrastructure/email/NodemailerEmailService.ts
import * as nodemailer from 'nodemailer';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

import { logger } from '../logging/winston';

import {
  EmailDeliveryError,
  QrGenerationError,
  EmailTemplateNotFoundError
} from '../errors';

import {
  IEmailService,
  SendTicketData
} from '../../domain/services/IEmailService';

export class NodemailerEmailService implements IEmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    const port = parseInt(
      process.env.SMTP_PORT || '587',
      10
    );

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: isNaN(port) ? 587 : port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Genera un PNG QR en memoria.
   */
  private async generateQrBuffer(
    ticketCode: string
  ): Promise<Buffer> {
    try {
      return await QRCode.toBuffer(ticketCode, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 300,
      });
    } catch (error) {
      logger.error('Failed generating QR code', {
        ticketCode,
        error,
      });

      throw new QrGenerationError(
        ticketCode,
        error
      );
    }
  }

  /**
   * Carga la plantilla HTML e inyecta los placeholders.
   */
  private getTemplateHtml(
    data: SendTicketData
  ): string {
    const templatePath = path.join(
      __dirname,
      'templates',
      'ticket.html'
    );

    if (!fs.existsSync(templatePath)) {
      throw new EmailTemplateNotFoundError(
        templatePath
      );
    }

    let html = fs.readFileSync(
      templatePath,
      'utf8'
    );

    const templateVariables: Record<
      string,
      string | number
    > = {
      ...data,
      currentYear: new Date().getFullYear(),
      termsUrl:
        process.env.PLATFORM_TERMS_URL || '#',
      privacyUrl:
        process.env.PLATFORM_PRIVACY_URL || '#',
    };

    for (const key in templateVariables) {
      if (
        Object.prototype.hasOwnProperty.call(
          templateVariables,
          key
        )
      ) {
        const placeholder = `{{${key}}}`;

        html = html
          .split(placeholder)
          .join(
            String(templateVariables[key])
          );
      }
    }

    return html;
  }

  /**
   * Envía el ticket digital al comprador.
   */
  public async sendTicketEmail(
    data: SendTicketData
  ): Promise<void> {
    logger.info(
      `Starting ticket email delivery for reservation ${data.ticketCode}`
    );

    try {
      const qrBuffer =
        await this.generateQrBuffer(
          data.ticketCode
        );

      const htmlBody =
        this.getTemplateHtml(data);

      const mailOptions: nodemailer.SendMailOptions =
        {
          from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
          to: data.to,
          subject: `Confirmación de pago - Entrada para ${data.eventName}`,
          html: htmlBody,
          attachments: [
            {
              filename: `ticket-${data.ticketCode}.png`,
              content: qrBuffer,
              cid: 'ticket-qr-code',
            },
          ],
        };

      await this.transporter.sendMail(
        mailOptions
      );

      logger.info(
        `Ticket email successfully delivered to ${data.to}`
      );
    } catch (error) {
      // Si ya es un error de infraestructura conocido,
      // simplemente lo propagamos.
      if (
        error instanceof QrGenerationError ||
        error instanceof EmailTemplateNotFoundError
      ) {
        throw error;
      }

      logger.error(
        'Failed sending ticket email',
        {
          recipient: data.to,
          ticketCode: data.ticketCode,
          error:
            error instanceof Error
              ? error.message
              : error,
        }
      );

      throw new EmailDeliveryError(
        data.to,
        data.ticketCode,
        error
      );
    }
  }

  /**
   * Verifica la conectividad SMTP.
   * Útil para validar la configuración al arrancar la aplicación.
   */
  public async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();

      logger.info(
        'SMTP connection verified successfully'
      );
    } catch (error) {
      throw new EmailDeliveryError(
        'SMTP_CONFIGURATION',
        'SMTP_VERIFY',
        error
      );
    }
  }
}