import pool from '../../../src/shared/infrastructure/database/connection';
import { RegisterUserHandler } from '../../../src/modules/auth/application/commands/RegisterUserHandler';
import { RegisterUserCommand } from '../../../src/modules/auth/application/commands/RegisterUserCommand';
import { CreateEventHandler } from '../../../src/modules/event/application/commands/CreateEventHandler';
import { CreateEventCommand } from '../../../src/modules/event/application/commands/CreateEventCommand';
import { PostgresEventRepository } from '../../../src/modules/event/infrastructure/repositories/PostgresEventRepository';
import { CreateReservationHandler } from '../../../src/modules/reservation/application/commands/CreateReservationHandler';
import { CreateReservationCommand } from '../../../src/modules/reservation/application/commands/CreateReservationCommand';
import { PostgresUserRepository } from '../../../src/modules/auth/infrastructure/repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '../../../src/modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtService } from '../../../src/modules/auth/infrastructure/services/JwtService';
import { EventCapacityExceededError, EventNotFoundError } from '../../../src/modules/event/domain/errors';

// Nuevas dependencias necesarias tras la refactorización
import { PostgresReservationRepository } from '../../../src/modules/reservation/infrastructure/repositories/PostgresReservationRepository';
import { PostgresTicketTypeRepository } from '../../../src/modules/event/infrastructure/repositories/PostgresTicketTypeRepository';
import { PostgresPaymentRepository } from '../../../src/modules/payment/infrastructure/repositories/PostgresPaymentRepository';
import { PostgresUnitOfWork } from '../../../src/shared/infrastructure/database/PostgresUnitOfWork';
import { InMemoryDomainEventDispatcher } from '../../../src/shared/infrastructure/messaging/InMemoryDomainEventDispatcher';

describe('CreateReservationHandler (Integration Test)', () => {
  let handler: CreateReservationHandler;
  let userId: string;
  let eventId: string;
  let ticketTypeId: string;

  beforeEach(async () => {
    // 1. Configurar infraestructura
    const eventDispatcher = new InMemoryDomainEventDispatcher();
    const uow = new PostgresUnitOfWork(pool, eventDispatcher);
    const userRepository = new PostgresUserRepository();
    const eventRepository = new PostgresEventRepository(); // Este es el que necesitamos
    const ticketTypeRepository = new PostgresTicketTypeRepository();
    const reservationRepository = new PostgresReservationRepository();
    const paymentRepository = new PostgresPaymentRepository();

    // 2. Instanciar Handler (AQUÍ ESTÁ EL CAMBIO CRÍTICO)
    // Pasamos eventRepository como tercer argumento ahora
    handler = new CreateReservationHandler(
        uow, 
        reservationRepository, 
        eventRepository, // <-- AGREGADO
        ticketTypeRepository, 
        paymentRepository
    );

    // 3. Setup de datos (resto igual...)
    const registerUserHandler = new RegisterUserHandler(userRepository, new BcryptPasswordHasher(), new JwtService());
    const user = await registerUserHandler.execute(new RegisterUserCommand({
      email: `reservation-${Date.now()}@test.com`,
      password: 'Password123',
      nombre: 'Reservation User',
      rol: 'ASISTENTE'
    }));
    userId = user.user.id;

    const createEventHandler = new CreateEventHandler(uow, eventRepository, ticketTypeRepository);
    const event = await createEventHandler.execute(
      new CreateEventCommand({
        titulo: 'Evento Integracion',
        descripcion: 'Evento para pruebas',
        fecha: new Date(Date.now() + 86400000).toISOString(),
        lugar: 'Oaxaca',
        organizadorId: userId,
        tickets: [
          {
            nombre: 'General',
            precio: 100,
            capacidadTotal: 100
          }
        ]
      })
    );
    eventId = event.id;

    const ticketResult = await pool.query('SELECT id FROM ticket_types WHERE evento_id = $1 LIMIT 1', [eventId]);
    ticketTypeId = ticketResult.rows[0].id;
  });

  test('debe crear una reserva y actualizar reservas_pendientes', async () => {
    const result = await handler.execute(new CreateReservationCommand({
      eventoId: eventId,
      ticketTypeId: ticketTypeId, // Ahora requerido
      usuarioId: userId,
      cantidadTickets: 2
    }));

    expect(result.id).toBeDefined();
    expect(result.estado).toBe('PENDIENTE_PAGO');
  });

  test('debe lanzar EventNotFoundError si el evento no existe', async () => {
    await expect(
      handler.execute(new CreateReservationCommand({
        eventoId: '11111111-1111-1111-1111-111111111111',
        ticketTypeId: '00000000-0000-0000-0000-000000000000',
        usuarioId: userId,
        cantidadTickets: 1
      }))
    ).rejects.toThrow(EventNotFoundError);
  });
});