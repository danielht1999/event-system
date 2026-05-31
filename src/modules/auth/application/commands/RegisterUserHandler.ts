// src/modules/auth/application/commands/RegisterUserHandler.ts
import { RegisterUserCommand } from './RegisterUserCommand';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../domain/services/IPasswordHasher';
import { IJwtService } from '../../domain/services/IJwtService';
import { v4 as uuidv4 } from 'uuid';
import { userQuantity } from '@shared/infrastructure/monitoring/metrics';

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
    // 1. Verificar que el email no exista
    const emailExists = await this.userRepository.emailExists(command.email);
    if (emailExists) {
      throw new Error('El email ya está registrado');
    }

    // 2. Hashear password (usando servicio, no bcrypt directo)
    const passwordHash = await this.passwordHasher.hash(command.password);

    // 3. Crear usuario
    const userId = uuidv4();
    const user = await this.userRepository.save({
      id: userId,
      email: command.email,
      nombre: command.nombre,
      password_hash: passwordHash,
      rol: command.rol
    });
    //metrics
    userQuantity.inc();

    // 4. Generar JWT
    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      rol: user.rol
    });

    // 5. Retornar resultado (sin exponer password_hash)
    return {
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol
      },
      token
    };
  }
}
