import * as nodemailer from 'nodemailer';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logging/winston';
import { IEmailService, SendTicketData } from '../../domain/services/IEmailService';

export class NodemailerEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: isNaN(port) ? 587 : port,
      secure: port === 465, // true para puerto 465, false para otros como 587 o 2525
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Transforma el código de acceso en un Buffer binario PNG en memoria RAM.
   */
  private async generateQrBuffer(text: string): Promise<Buffer> {
    try {
      return await QRCode.toBuffer(text, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 300
      });
    } catch (error) {
      logger.error('Error generando el buffer del código QR', { error });
      throw error;
    }
  }

  /**
   * Lee la plantilla HTML de forma segura e inyecta los placeholders de manera secuencial.
   */
  private getTemplateHtml(data: SendTicketData): string {
    // Resolvemos la ruta relativa de forma que funcione en desarrollo (src) y producción (dist)
    const templatePath = path.join(__dirname, 'templates', 'ticket.html');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`La plantilla de correo no existe en la ruta especificada: ${templatePath}`);
    }

    let html = fs.readFileSync(templatePath, 'utf8');

    // Mapeo dinámico y agnóstico de placeholders agregando las variables globales de entorno
    const templateVariables: Record<string, string | number> = {
      ...data,
      currentYear: new Date().getFullYear(),
      termsUrl: process.env.PLATFORM_TERMS_URL || '#',
      privacyUrl: process.env.PLATFORM_PRIVACY_URL || '#'
    };

    // Bucle limpio secuencial para inyectar cada dato en el HTML
    for (const key in templateVariables) {
      if (Object.prototype.hasOwnProperty.call(templateVariables, key)) {
        const placeholder = `{{${key}}}`;
        const value = String(templateVariables[key]);
        // Reemplazamos todas las ocurrencias globales del placeholder
        html = html.split(placeholder).join(value);
      }
    }

    return html;
  }

  /**
   * Orquesta y despacha de forma asíncrona el manifiesto de acceso.
   */
  public async sendTicketEmail(data: SendTicketData): Promise<void> {
    try {
      logger.info(`Iniciando proceso de envío de ticket para la reserva: ${data.ticketCode}`);

      // 1. Generamos el QR en memoria
      const qrBuffer = await this.generateQrBuffer(data.ticketCode);

      // 2. Compilamos el HTML estructurado
      const htmlBody = this.getTemplateHtml(data);

      // 3. Configuramos los parámetros MIME de Nodemailer
      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: data.to,
        subject: `Confirmación de pago - Entrada para ${data.eventName}`,
        html: htmlBody,
        attachments: [
          {
            filename: `ticket-${data.ticketCode}.png`,
            content: qrBuffer,
            cid: 'ticket-qr-code', // Mapea exactamente con <img src="cid:ticket-qr-code">
          },
        ],
      };

      // 4. Despachamos al servidor SMTP externo
      await this.transporter.sendMail(mailOptions);
      
      logger.info(`Correo con ticket de acceso enviado con éxito a: ${data.to}`);
    } catch (error) {
      // Registramos el error en Winston de manera controlada para que no tire abajo la aplicación principal
      logger.error(`Fallo catastrófico al enviar el email del ticket a ${data.to}`, {
        ticketCode: data.ticketCode,
        error: error instanceof Error ? error.message : error
      });
      
      // Lanzamos la excepción para que el suscriptor asíncrono pueda decidir si gestiona un reintento
      throw error;
    }
  }
}