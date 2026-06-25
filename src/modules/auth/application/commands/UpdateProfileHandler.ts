// src/modules/auth/application/commands/UpdateProfileHandler.ts

import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UpdateProfileCommand } from './UpdateProfileCommand';
import { Email } from '../../domain/value-objects/Email';
import { UserNotFoundError, EmailAlreadyRegisteredError } from '../../domain/errors';
import { DomainEventNames } from '@shared/domain/DomainEventNames';
import { 
  UserProfileUpdatedPayload,
  UserRoleChangedPayload
} from '@shared/domain/DomainEventPayloads';

export interface UpdateUserResult {
  user: {
    id: string;
    email: string;   
    nombre: string;  
  }
}

export class UpdateProfileHandler {
  constructor(
    private userRepository: IUserRepository
  ) {}

  async execute(command: UpdateProfileCommand): Promise<UpdateUserResult> {    
    // 1. Recuperar usuario
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundError(command.userId);
    }

    let emailFinal = user.emailVO;

    // 2. Procesar email si cambia
    if (command.email !== undefined) {
      const nuevoEmail = new Email(command.email);
      if (!nuevoEmail.equals(user.emailVO)) {
        const emailTaken = await this.userRepository.emailExists(nuevoEmail.value);
        if (emailTaken) {
          throw new EmailAlreadyRegisteredError(nuevoEmail.value);
        }
        emailFinal = nuevoEmail;
      }
    }

    // 3. Fusionar estados
    const nombreFinal = command.nombre ?? user.nombre;

    // 4. Delegar al dominio (la entidad emite evento internamente)
    user.actualizarPerfil(nombreFinal, emailFinal);

    // 5. Persistir
    const updatedUser = await this.userRepository.save(user);

    // 6. ✅ RECOLECTAR Y TIPAR EVENTOS DE LA ENTIDAD
    const rawEvents = updatedUser.pullDomainEvents();
    
    const typedEvents = rawEvents.map(e => {
      if (e.eventName === DomainEventNames.AUTH.USER_PROFILE_UPDATED) {
        return {
          ...e,
          data: e.data as UserProfileUpdatedPayload
        };
      }
      if (e.eventName === DomainEventNames.AUTH.USER_ROLE_CHANGED) {
        return {
          ...e,
          data: e.data as UserRoleChangedPayload
        };
      }
      return e;
    });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email, 
        nombre: updatedUser.nombre
      }
    };
  }
}