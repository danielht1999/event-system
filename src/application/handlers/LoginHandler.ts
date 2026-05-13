// application/handlers/LoginHandler.ts
import { LoginCommand } from '../commands/LoginCommand';
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
    // 1. Buscar usuario por email
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new Error('Email o contraseña incorrectos');
    }

    // 2. Verificar password
    const isValid = await this.passwordHasher.compare(command.password, user.password_hash);
    if (!isValid) {
      throw new Error('Email o contraseña incorrectos');
    }

    // 3. Generar JWT
    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      rol: user.rol
    });

    // 4. Retornar resultado
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
