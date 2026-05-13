// src/infrastructure/di/container.ts
import { AuthController } from '../../api/controllers/AuthController';
import { RegisterUserHandler } from '../../application/handlers/RegisterUserHandler';
import { LoginHandler } from '../../application/handlers/LoginHandler';
import { GetProfileHandler } from '../../application/handlers/GetProfileHandler';
import { PostgresUserRepository } from '../repositories/PostgresUserRepository';
import { BcryptPasswordHasher } from '../services/BcryptPasswordHasher';
import { JwtService } from '../services/JwtService';
import { PostgresEventoRepository } from '../repositories/PostgresEventoRepository';
import { CreateEventHandler } from '../../application/handlers/CreateEventHandler';
import { EventoController } from '../../api/controllers/EventoController';
import { ListarEventosHandler } from '../../application/handlers/ListarEventosHandler';
import { CrearReservaHandler } from '../../application/handlers/CrearReservaHandler';
import { ReservaController } from '../../api/controllers/ReservaController';
import pool from '../database/connection';
import {  ReservaTransaccionService } from '../../infrastructure/services/ReservaTransaccionService';

// Repositorios
const userRepository = new PostgresUserRepository();
const eventoRepository = new PostgresEventoRepository();
const reservaTransaccionService = new ReservaTransaccionService(pool);

// Servicios
const passwordHasher = new BcryptPasswordHasher();
const jwtService = new JwtService();


// Handlers
const registerHandler = new RegisterUserHandler(userRepository, passwordHasher, jwtService);
const loginHandler = new LoginHandler(userRepository, passwordHasher, jwtService);
const getProfileHandler = new GetProfileHandler(userRepository);
const createEventHandler = new CreateEventHandler(eventoRepository);
const listarEventosHandler = new ListarEventosHandler(eventoRepository);
const crearReservaHandler = new CrearReservaHandler(reservaTransaccionService);

// Controllers
export const authController = new AuthController(
  registerHandler,
  loginHandler,
  getProfileHandler
);

export const eventoController = new EventoController(
  createEventHandler,
  eventoRepository,
  listarEventosHandler
);

export const reservaController = new ReservaController(crearReservaHandler);