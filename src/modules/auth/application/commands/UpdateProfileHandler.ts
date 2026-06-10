// src/modules/auth/application/commands/UpdateProfilehandler.ts
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UpdateProfileCommand } from './UpdateProfileCommand';
import { Email } from '../../domain/value-objects/Email';
import { UserNotFoundError, EmailAlreadyRegisteredError } from '../../domain/errors'; // Errores específicos vía Barril

export interface UpdateUserResult {
  user: {
    id: string;
    email: string;   
    nombre: string;  
  }
}

export class UpdateProfilehandler {
  constructor(
    private userRepository: IUserRepository
  ) {}

  async execute(command: UpdateProfileCommand): Promise<UpdateUserResult> {    
    // 1. Recuperamos la entidad completa desde la BD
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      // Lanzamos un 404 semántico
      throw new UserNotFoundError(command.userId);
    }

    // Por defecto, mantenemos el Value Object de Email que ya tiene la entidad
    let emailFinal = user.emailVO; 

    // 2. Si el cliente envió un email, lo procesamos y validamos
    if (command.email !== undefined) {
      const nuevoEmail = new Email(command.email);

      // Comparamos usando la semántica del Value Object (.equals)
      if (!nuevoEmail.equals(user.emailVO)) {
        // Validamos disponibilidad en BD usando el string sanitizado (.value)
        const emailTaken = await this.userRepository.emailExists(nuevoEmail.value);
        if (emailTaken) {
          // Lanzamos un 409 semántico pasándole el email duplicado
          throw new EmailAlreadyRegisteredError(nuevoEmail.value);
        }
        emailFinal = nuevoEmail; 
      }
    }

    // 3. FUSIÓN DE ESTADOS (Opcionales)
    const nombreFinal = command.nombre ?? user.nombre;

    // 4. DELEGACIÓN AL DOMINIO: Pasamos el objeto rico Email sin miedo
    user.actualizarPerfil(nombreFinal, emailFinal);

    // 5. PERSISTENCIA ATÓMICA
    const updatedUser = await this.userRepository.save(user);    

    // 6. Retornar el DTO estructurado
    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email, 
        nombre: updatedUser.nombre
      }
    };
  }
}