// src/modules/auth/application/commands/LoginHandler.ts
import { LoginCommand } from './LoginCommand';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../domain/services/IPasswordHasher';
import { IJwtService } from '../../domain/services/IJwtService';

export interface LoginResult {
  user: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
  };
  token: string;
}

export class LoginHandler {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private jwtService: IJwtService
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    // 1. Buscar agregación de Login (Usuario + Credencial) por email
    const authAggregation = await this.userRepository.findByEmailWithPassword(command.email);
    if (!authAggregation) {
      throw new Error('Email o contraseña incorrectos');
    }

    const { user, passwordHash } = authAggregation;

    // 2. Verificar contraseña usando el hash extraído externamente
    const isValid = await this.passwordHasher.compare(command.password, passwordHash);
    if (!isValid) {
      throw new Error('Email o contraseña incorrectos');
    }

    // 3. Generar JWT acoplado a las propiedades de la entidad pura
    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      rol: user.rol
    });

    // 4. Retornar DTO de salida
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