// src/modules/auth/application/commands/RegisterUserHandler.ts
import { RegisterUserCommand } from './RegisterUserCommand';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../domain/services/IPasswordHasher';
import { IJwtService } from '../../domain/services/IJwtService';
import { User } from '../../domain/entities/User';
import { v4 as uuidv4 } from 'uuid';
import { userQuantity } from '@shared/infrastructure/monitoring/metrics';
import { UserRole } from '../../domain/entities/User';
import { EmailAlreadyRegisteredError } from '../../domain/errors'; // Error semántico específico

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
    // 1. Validación cruzada de infraestructura: Verificar disponibilidad del email
    const emailExists = await this.userRepository.emailExists(command.email);
    if (emailExists) {
      // Lanzamos 409 semántico pasando el email en conflicto
      throw new EmailAlreadyRegisteredError(command.email);
    }

    // 2. Hashear password usando el servicio abstracto de dominio
    const passwordHash = await this.passwordHasher.hash(command.password);

    // 3. DOMINIO: Instanciar la entidad rica de dominio User
    const userId = uuidv4();
    const newUser = new User(
      userId,
      command.email,
      command.nombre,
      command.rol as UserRole
    );

    // Opcional: Registramos el hecho histórico dentro de la bolsa de eventos si lo deseas
    newUser.recordEvent('UserRegistered', { userId: newUser.id, email: newUser.email });

    // 4. PERSISTENCIA: Delegamos el almacenamiento y despacho de eventos usando el método explícito
    const savedUser = await this.userRepository.create(newUser, passwordHash);
    
    // Incremento de métricas para monitoreo técnico
    userQuantity.inc();

    // 5. INFRAESTRUCTURA: Generar JWT usando los datos devueltos por el dominio
    const token = this.jwtService.sign({
      id: savedUser.id,
      email: savedUser.email,
      rol: savedUser.rol
    });

    // 6. Retornar resultado estructurado (El DTO nunca expone secretos)
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