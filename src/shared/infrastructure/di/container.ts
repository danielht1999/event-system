// =========================================================================
// AUTH MODULE
// =========================================================================

import { AuthController } from '@modules/auth/infrastructure/controllers/AuthController';
import { RegisterUserHandler } from '@modules/auth/application/commands/RegisterUserHandler';
import { LoginHandler } from '@modules/auth/application/commands/LoginHandler';
import { UpdateProfileHandler } from '@modules/auth/application/commands/UpdateProfileHandler';
import { GetProfileHandler } from '@modules/auth/application/queries/GetProfileHandler';
import { PostgresUserRepository } from '@modules/auth/infrastructure/repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '@modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtService } from '@modules/auth/infrastructure/services/JwtService';

// =========================================================================
// EVENT MODULE
// =========================================================================

import { EventController } from '@modules/event/infrastructure/controllers/EventController';
import { TicketTypeController } from '@modules/event/infrastructure/controllers/TicketTypeController';
import { CreateEventHandler } from '@modules/event/application/commands/CreateEventHandler';
import { UpdateEventHandler } from '@modules/event/application/commands/UpdateEventHandler';
import { PublishEventHandler } from '@modules/event/application/commands/PublishEventHandler';
import { CancelEventHandler } from '@modules/event/application/commands/CancelEventHandler';
import { CreateTicketTypeHandler } from '@modules/event/application/commands/CreateTicketTypeHandler';
import { UpdateTicketTypeHandler } from '@modules/event/application/commands/UpdateTicketTypeHandler';
import { IncreaseTicketCapacityHandler } from '@modules/event/application/commands/IncreaseTicketCapacityHandler';
import { DeactivateTicketTypeHandler } from '@modules/event/application/commands/DeactivateTicketTypeHandler';
import { GetEventsHandler } from '@modules/event/application/queries/GetEventsHandler';
import { GetEventByIdHandler } from '@modules/event/application/queries/GetEventByIdHandler';
import { GetEventAvailabilityHandler } from '@modules/event/application/queries/GetEventAvailabilityHandler';
import { GetTicketTypesByEventHandler } from '@modules/event/application/queries/GetTicketTypesByEventHandler';
import { GetTicketTypeByIdHandler } from '@modules/event/application/queries/GetTicketTypeByIdHandler';
import { PostgresEventRepository } from '@modules/event/infrastructure/repositories/PostgresEventRepository';
import { PostgresTicketTypeRepository } from '@modules/event/infrastructure/repositories/PostgresTicketTypeRepository';
import { PostgresEventQueryService } from '@modules/event/infrastructure/queries/PostgresEventQueryService';
import { CachedEventQueryService } from '@modules/event/infrastructure/queries/CachedEventQueryService';
import { EventCacheSubscriber } from '@modules/event/infrastructure/services/EventCacheSubscriber';

// =========================================================================
// RESERVATION MODULE
// =========================================================================

import { ReservationController } from '@modules/reservation/infrastructure/controllers/ReservationController';
import { CreateReservationHandler } from '@modules/reservation/application/commands/CreateReservationHandler';
import { ConfirmPaymentHandler } from '@modules/reservation/application/commands/ConfirmPaymentHandler';
import { CancelReservationHandler } from '@modules/reservation/application/commands/CancelReservationHandler';
import { ExpireReservationsHandler } from '@modules/reservation/application/commands/ExpireReservationsHandler';
import { PostgresReservationRepository } from '@modules/reservation/infrastructure/repositories/PostgresReservationRepository';
import { PostgresReservationQueryService } from '@modules/reservation/infrastructure/queries/PostgresReservationQueryService';
import { SendTicketEmailOnReservationConfirmed } from '@modules/reservation/infrastructure/subscribers/SendTicketEmailOnReservationConfirmed';
import { GetReservationsHandler } from '@modules/reservation/application/queries/GetReservationsHandler';

// =========================================================================
// PAYMENT MODULE
// =========================================================================

import { PostgresPaymentRepository } from '@modules/payment/infrastructure/repositories/PostgresPaymentRepository';

// =========================================================================
// SHARED INFRASTRUCTURE
// =========================================================================

import pool from '@shared/infrastructure/database/connection';
import { PostgresUnitOfWork } from '@shared/infrastructure/database/PostgresUnitOfWork';
import { InMemoryDomainEventDispatcher } from '@shared/infrastructure/messaging/InMemoryDomainEventDispatcher';
import { NodemailerEmailService } from '@shared/infrastructure/email/NodemailerEmailService';

// =========================================================================
// 1. REPOSITORIES
// =========================================================================

const userRepository = new PostgresUserRepository();
const eventRepository = new PostgresEventRepository();
const ticketTypeRepository = new PostgresTicketTypeRepository();
const reservationRepository = new PostgresReservationRepository();
const paymentRepository = new PostgresPaymentRepository();

// =========================================================================
// 2. INFRASTRUCTURE SERVICES
// =========================================================================

const passwordHasher = new BcryptPasswordHasher();
const jwtService = new JwtService();
const emailService = new NodemailerEmailService();
const eventDispatcher = new InMemoryDomainEventDispatcher();
const uow = new PostgresUnitOfWork(pool, eventDispatcher);

// =========================================================================
// 3. QUERY SERVICES
// =========================================================================

const postgresEventQueryService = new PostgresEventQueryService();
const cachedEventQueryService = new CachedEventQueryService(postgresEventQueryService);
const reservationQueryService = new PostgresReservationQueryService();

// =========================================================================
// 4. AUTH HANDLERS
// =========================================================================

const registerHandler = new RegisterUserHandler(userRepository, passwordHasher, jwtService);
const loginHandler = new LoginHandler(userRepository, passwordHasher, jwtService);
const getProfileHandler = new GetProfileHandler(userRepository);
const updateProfileHandler = new UpdateProfileHandler(userRepository);

// =========================================================================
// 5. EVENT HANDLERS
// =========================================================================
// Commands

const createEventHandler = new CreateEventHandler(uow, eventRepository, ticketTypeRepository);
const updateEventHandler = new UpdateEventHandler(uow, eventRepository);
const publishEventHandler = new PublishEventHandler(uow, eventRepository);
const cancelEventHandler = new CancelEventHandler(uow, eventRepository);

// Queries

const getEventsHandler = new GetEventsHandler(cachedEventQueryService);
const getEventByIdHandler = new GetEventByIdHandler(eventRepository);
const getEventAvailabilityHandler = new GetEventAvailabilityHandler(ticketTypeRepository);

// =========================================================================
// 6. TICKET TYPE HANDLERS
// =========================================================================
// Commands

const createTicketTypeHandler = new CreateTicketTypeHandler(uow, eventRepository, ticketTypeRepository);
const updateTicketTypeHandler = new UpdateTicketTypeHandler(uow, eventRepository, ticketTypeRepository);
const increaseTicketCapacityHandler = new IncreaseTicketCapacityHandler(uow, eventRepository, ticketTypeRepository);
const deactivateTicketTypeHandler = new DeactivateTicketTypeHandler(uow, eventRepository, ticketTypeRepository);

// Queries

const getTicketTypesByEventHandler = new GetTicketTypesByEventHandler(ticketTypeRepository);
const getTicketTypeByIdHandler = new GetTicketTypeByIdHandler(ticketTypeRepository);

// =========================================================================
// 7. RESERVATION HANDLERS
// =========================================================================

const createReservationHandler = new CreateReservationHandler(uow, reservationRepository, ticketTypeRepository, paymentRepository);
const confirmPaymentHandler = new ConfirmPaymentHandler(uow, reservationRepository, ticketTypeRepository);
const cancelReservationHandler = new CancelReservationHandler(uow, reservationRepository, ticketTypeRepository);
export const expireReservationHandler = new ExpireReservationsHandler(reservationRepository);
const getReservationsHandler = new GetReservationsHandler(reservationQueryService);

// =========================================================================
// 8. CONTROLLERS
// =========================================================================

export const authController = new AuthController(registerHandler, loginHandler, getProfileHandler, updateProfileHandler);
export const eventController = new EventController(createEventHandler, updateEventHandler, getEventsHandler, getEventByIdHandler, getEventAvailabilityHandler, publishEventHandler, cancelEventHandler);
export const ticketTypeController = new TicketTypeController(createTicketTypeHandler, updateTicketTypeHandler, increaseTicketCapacityHandler, deactivateTicketTypeHandler, getTicketTypesByEventHandler, getTicketTypeByIdHandler);
export const reservationController = new ReservationController(createReservationHandler, confirmPaymentHandler, cancelReservationHandler, getReservationsHandler);

// =========================================================================
// 9. SUBSCRIBERS
// =========================================================================

new EventCacheSubscriber();
const ticketEmailListener = new SendTicketEmailOnReservationConfirmed(emailService, reservationQueryService);
ticketEmailListener.listen();