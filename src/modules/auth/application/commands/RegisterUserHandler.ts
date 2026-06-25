// src/modules/auth/application/commands/RegisterUserHandler.ts

import { RegisterUserCommand } from './RegisterUserCommand';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../domain/services/IPasswordHasher';
import { IJwtService } from '../../domain/services/IJwtService';
import { User, UserRole } from '../../domain/entities/User';
import { v4 as uuidv4 } from 'uuid';
import { userQuantity } from '@shared/infrastructure/monitoring/metrics';
import { EmailAlreadyRegisteredError } from '../../domain/errors';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { 
  UserCreatedPayload, 
  UserRoleChangedPayload,
  UserProfileUpdatedPayload 
} from '@shared/domain/DomainEventPayloads';
import { IDomainEvent } from '@shared/domain/IDomainEvent';

export interface RegisterUserResult {
  user: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
  };
  token: string;
}

export class RegisterUserHandler {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private jwtService: IJwtService
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    // 1. Validar email disponible
    const emailExists = await this.userRepository.emailExists(command.email);
    if (emailExists) {
      throw new EmailAlreadyRegisteredError(command.email);
    }

    // 2. Hashear password
    const passwordHash = await this.passwordHasher.hash(command.password);

    // 3. Crear usuario (la entidad emite USER_CREATED internamente)
    const userId = uuidv4();
    const newUser = User.create({
      id: userId,
      email: command.email,
      nombre: command.nombre,
      rol: command.rol as UserRole,
      passwordHash 
    });

    // 4. Persistir
    const savedUser = await this.userRepository.create(newUser);
    userQuantity.inc();

    // 5. ✅ RECOLECTAR Y TIPAR EVENTOS DE LA ENTIDAD
    const rawEvents = savedUser.pullDomainEvents();
    
    const typedEvents = rawEvents.map(e => {
      if (e.eventName === DomainEventNames.AUTH.USER_CREATED) {
        return {
          ...e,
          data: e.data as UserCreatedPayload
        };
      }
      if (e.eventName === DomainEventNames.AUTH.USER_ROLE_CHANGED) {
        return {
          ...e,
          data: e.data as UserRoleChangedPayload
        };
      }
      if (e.eventName === DomainEventNames.AUTH.USER_PROFILE_UPDATED) {
        return {
          ...e,
          data: e.data as UserProfileUpdatedPayload
        };
      }
      return e;
    });

    // ✅ Emitir eventos tipados (depende de tu infraestructura)
    // this.eventDispatcher.dispatch(typedEvents);

    // 6. Generar JWT
    const token = this.jwtService.sign({
      id: savedUser.id,
      email: savedUser.email,
      rol: savedUser.rol
    });

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        nombre: savedUser.nombre,
        rol: savedUser.rol
      },
      token
    };
  }
}