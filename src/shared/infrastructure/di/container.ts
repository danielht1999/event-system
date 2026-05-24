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

import pool from '@shared/infrastructure/database/connection';

// Repositorios
const userRepository = new PostgresUserRepository();
const eventRepository = new PostgresEventRepository();
const reservationTransactionService = new ReservationTransactionService(pool);

// Servicios
const passwordHasher = new BcryptPasswordHasher();
const jwtService = new JwtService();

// Handlers
const registerHandler = new RegisterUserHandler(userRepository, passwordHasher, jwtService);
const loginHandler = new LoginHandler(userRepository, passwordHasher, jwtService);
const getProfileHandler = new GetProfileHandler(userRepository);
const createEventHandler = new CreateEventHandler(eventRepository);
const getEventsHandler = new GetEventsHandler(eventRepository);
const createReservationHandler = new CreateReservationHandler(reservationTransactionService);
const confirmPaymentHandler = new ConfirmPaymentHandler(reservationTransactionService);
const cancelReservationHandler = new CancelReservationHandler(reservationTransactionService);

// Controllers
export const authController = new AuthController(
  registerHandler,
  loginHandler,
  getProfileHandler
);

export const eventController = new EventController(
  createEventHandler,
  eventRepository,
  getEventsHandler
);

export const reservationController = new ReservationController(createReservationHandler, confirmPaymentHandler,cancelReservationHandler);