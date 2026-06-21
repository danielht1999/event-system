import * as dotenv from 'dotenv';
import * as path from 'path';

// 1. Cargar las variables de entorno antes de importar el servicio
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { NodemailerEmailService } from '../../src/shared/infrastructure/email/NodemailerEmailService';
import { SendTicketData } from '../../src/shared/domain/services/IEmailService';

async function runEmailSmokeTest() {
  console.log('🚀 [TEST] Inicializando el servicio de mensajería...');
  const emailService = new NodemailerEmailService();

  // 2. Verificar que el apretón de manos (handshake) SMTP responda
  try {
    await emailService.verifyConnection();
  } catch (error) {
    console.error('❌ [TEST] Error de conexión SMTP. Revisa tus credenciales del .env');
    process.exit(1);
  }

  // 3. Mockear un payload idéntico al que emitirá el dominio
  const mockTicket: SendTicketData = {
    to: 'asistente_test@gmail.com',
    clientName: 'DANIEL CASTILLO',
    eventName: 'CYBERPUNK DEV CONFERENCE 2026',
    eventDate: 'VIERNES, 13 DE NOVIEMBRE DE 2026',
    eventLocation: 'AUDITORIO CENTRAL - SECTOR 7',
    ticketQuantity: 2,
    totalAmount: 150,
    paymentDate: '10/06/2026 19:30',
    ticketCode: 'EVTX-99X2-CR77'
  };

  console.log(`📨 [TEST] Despachando ticket experimental a: ${mockTicket.to}...`);

  try {
    await emailService.sendTicketEmail(mockTicket);
    console.log('✅ [TEST] ¡Correo enviado con éxito! Revisa la bandeja de Mailtrap.');
  } catch (error) {
    console.error('❌ [TEST] Falló el envío del correo del ticket.');
    console.error(error);
  }
}

// Ejecutar el script
runEmailSmokeTest();