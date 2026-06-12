// src/shared/infrastructure/di/container.ts
import { AuthController } from '@modules/auth/infrastructure/controllers/AuthController';
import { RegisterUserHandler } from '@modules/auth/application/commands/RegisterUserHandler';
import { LoginHandler } from '@modules/auth/application/commands/LoginHandler';
import { GetProfileHandler } from '@modules/auth/application/queries/GetProfileHandler';
import { PostgresUserRepository } from '@modules/auth/infrastructure/repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '@modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtService } from '@modules/auth/infrastructure/services/JwtService';

import { PostgresEventRepository } from '@modules/event/infrastructure/repositories/PostgresEventRepository';
import { CreateEventHandler } from '@modules/event/application/commands/CreateEventHandler';
import { EventController } from '@modules/event/infrastructure/controllers/EventController';
import { GetEventsHandler } from '@modules/event/application/queries/GetEventsHandler';

import { CreateReservationHandler } from '@modules/reservation/application/commands/CreateReservationHandler';
import { ReservationController } from '@modules/reservation/infrastructure/controllers/ReservationController';
import { ReservationTransactionService } from '@modules/reservation/infrastructure/services/ReservationTransactionService';
import { ConfirmPaymentHandler } from '@modules/reservation/application/commands/ConfirmPaymentHandler';
import { CancelReservationHandler } from '@modules/reservation/application/commands/CancelReservationHandler';
import { GetEventsByOrganizerHandler } from '@modules/event/application/queries/GetEventsByOrganizerHandler';
import { PostgresEventQueryService } from '@modules/event/infrastructure/queries/PostgresEventQueryService';
import { PostgresReservationQueryService } from '@modules/reservation/infrastructure/queries/PostgresReservationQueryService';

import pool from '@shared/infrastructure/database/connection';
import { UpdateProfilehandler } from '@modules/auth/application/commands/UpdateProfileHandler';
import { ExpireReservationsHandler } from '@modules/reservation/application/commands/ExpireReservationsHandler';
import { PostgresReservationRepository } from '@modules/reservation/infrastructure/repositories/PostgresReservationRepository';
import { CachedEventQueryService } from '@modules/event/infrastructure/queries/CachedEventQueryService';

import { EventCacheSubscriber } from '@modules/event/infrastructure/services/EventCacheSubscriber';
import { domainEventBus } from '@shared/infrastructure/messaging/DomainEventBus';
import { SendTicketEmailOnReservationConfirmed } from '@modules/reservation/infrastructure/subscribers/SendTicketEmailOnReservationConfirmed';
import { NodemailerEmailService } from '@shared/infrastructure/email/NodemailerEmailService'
// Repositorios
const userRepository = new PostgresUserRepository();
const eventRepository = new PostgresEventRepository();
const reservationTransactionService = new ReservationTransactionService(pool);
const reservationRepository = new PostgresReservationRepository();

// Servicios
const passwordHasher = new BcryptPasswordHasher();
const jwtService = new JwtService();
const emailService = new  NodemailerEmailService();

// Query Service
const postgresEventQueryService = new PostgresEventQueryService();
const reservationQueryService = new PostgresReservationQueryService();
const cachedEventQueryService = new CachedEventQueryService(postgresEventQueryService);

// Handlers
const registerHandler = new RegisterUserHandler(userRepository, passwordHasher, jwtService);
const loginHandler = new LoginHandler(userRepository, passwordHasher, jwtService);
const getProfileHandler = new GetProfileHandler(userRepository);
const createEventHandler = new CreateEventHandler(eventRepository);
const getEventsHandler = new GetEventsHandler(cachedEventQueryService);
const createReservationHandler = new CreateReservationHandler(reservationTransactionService);
const confirmPaymentHandler = new ConfirmPaymentHandler(reservationTransactionService);
const cancelReservationHandler = new CancelReservationHandler(reservationTransactionService);
const updateProfileHandler = new UpdateProfilehandler(userRepository);
export const expireReservationHandler = new ExpireReservationsHandler(reservationRepository);

//Queries
const getEventsByOrganizerHandler = new GetEventsByOrganizerHandler(cachedEventQueryService);

// Controllers
export const authController = new AuthController(
  registerHandler,
  loginHandler,
  getProfileHandler,
  updateProfileHandler
);

export const eventController = new EventController(
  createEventHandler,
  eventRepository,
  getEventsHandler,
  getEventsByOrganizerHandler
);

export const reservationController = new ReservationController(createReservationHandler, confirmPaymentHandler, cancelReservationHandler, reservationQueryService); 

new EventCacheSubscriber();

// Instanciamos el listener pasándole sus dos argumentos requeridos
const ticketEmailListener = new SendTicketEmailOnReservationConfirmed(emailService, reservationQueryService);
//Le ordenamos a la clase que empiece a escuchar al Bus Global
ticketEmailListener.listen();