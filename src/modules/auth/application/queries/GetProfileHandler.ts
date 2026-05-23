// src/modules/auth/application/queries/GetProfileHandler.ts
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export class GetProfileHandler {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // No retornamos password_hash
    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      creado_en: user.creado_en
    };
  }
}
