import { User } from '../entities/User';

export interface IUserRepository {
  /**
   * Busca un usuario por su correo electrónico.
   * Retorna la entidad rica de dominio User o null si no existe.
   */
  findByEmail(email: string, transactionContext?: unknown): Promise<User | null>;

  /**
   * Busca un usuario por su identificador único UUID.
   */
  findById(id: string, transactionContext?: unknown): Promise<User | null>;

  /**
   * Verifica de forma rápida si un email ya se encuentra ocupado en el sistema.
   */
  emailExists(email: string, transactionContext?: unknown): Promise<boolean>;

  /**
   * Registra un usuario nuevo en el sistema inyectando su hash de seguridad de forma aislada.
   * Diseñado específicamente para el caso de uso de Registro.
   */
  create(user: User, passwordHash: string, transactionContext?: unknown): Promise<User>;

  /**
   * Sincroniza las mutaciones de estado de la entidad (perfil, roles) en la persistencia.
   */
  save(user: User, transactionContext?: unknown): Promise<User>;

  /**
   * Recupera la entidad de dominio User junto con su hash de contraseña.
   * Método de uso exclusivo para el proceso de autenticación (Login).
   */
  findByEmailWithPassword(email: string, transactionContext?: unknown): Promise<{ user: User; passwordHash: string } | null>;
}