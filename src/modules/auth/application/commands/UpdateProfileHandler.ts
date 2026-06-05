// src/modules/auth/application/commands/UpdateProfilehandler.ts
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UpdateProfileCommand } from './UpdateProfileCommand';

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
    // 1. Recuperamos la agregación/entidad completa desde la BD
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new Error(`Usuario con id ${command.userId} no encontrado`);
    }

    // 2. Validación de negocio cruzada: Si el email cambia, verificamos disponibilidad
    if (command.email !== undefined && command.email !== user.email) {
      const emailTaken = await this.userRepository.emailExists(command.email);
      if (emailTaken) {
        throw new Error(`El email ${command.email} ya está registrado`);
      }
    }

    // 3. FUSIÓN DE ESTADOS: Resolvemos los opcionales antes de ir al dominio
    const nombreFinal = command.nombre ?? user.nombre;
    const emailFinal = command.email ?? user.email;

    // 4. DELEGACIÓN AL DOMINIO: La entidad valida el formato interno, muta y genera los eventos
    user.actualizarPerfil(nombreFinal, emailFinal);

    // 5. PERSISTENCIA ATÓMICA: Guardamos con save() (Upsert), despachando eventos automáticamente
    const updatedUser = await this.userRepository.save(user);    

    // 6. Retornar el DTO de respuesta estructurado
    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        nombre: updatedUser.nombre
      }
    };
  }
}