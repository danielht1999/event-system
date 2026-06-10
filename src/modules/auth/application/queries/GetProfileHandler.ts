// src/modules/auth/application/queries/GetProfileHandler.ts
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserNotFoundError } from '../../domain/errors'; // Error semántico específico vía Barril

export class GetProfileHandler {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      // Lanzamos el 404 semántico correspondiente
      throw new UserNotFoundError(userId);
    }

    // No retornamos password_hash (El DTO se mantiene hermético)
    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      creadoEn: user.creadoEn
    };
  }
}