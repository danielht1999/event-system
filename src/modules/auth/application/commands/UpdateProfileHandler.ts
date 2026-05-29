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
    // 1. Verificar que el usuario existe antes de hacer nada
    const userExists = await this.userRepository.findById(command.userId);
    if (!userExists) {
      throw new Error(`Usuario con id ${command.userId} no encontrado`);
    }

    // 2. Preparar el objeto con los datos reales que se van a actualizar
    const dataToUpdate: Partial<{ email: string; nombre: string }> = {};

    // 3. Validar y añadir el email solo si cambió
    //userExists.email es el email del usario que sale en la db
    if (command.email !== undefined && command.email !== userExists.email) {
      const emailTaken = await this.userRepository.emailExists(command.email);
      if (emailTaken) {
        throw new Error(`El email ${command.email} ya está registrado`);
      }
      dataToUpdate.email = command.email;
    }

    // 4. Añadir el nombre solo si viene en el comando y es diferente al actual
    if (command.nombre !== undefined && command.nombre !== userExists.nombre) {
      dataToUpdate.nombre = command.nombre;
    }

    // 5. Si no hay cambios reales, retornamos el usuario que ya trajimos de la BD
    if (Object.keys(dataToUpdate).length === 0) {
      return {
        user: {
          id: userExists.id,
          email: userExists.email,
          nombre: userExists.nombre
        }
      };
    }

    // 6. Ejecutar la actualización si hubo cambios
    const updatedUser = await this.userRepository.update(command.userId, dataToUpdate);    

    // 7. Retornar el resultado con la data fresca de la BD
    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        nombre: updatedUser.nombre
      }
    };
  }
}