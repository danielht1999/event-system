// src/modules/auth/domain/repositories/IUserRepository.ts
import { User } from '../entities/User';

export interface IUserRepository {
  /**
   * Busca un usuario por su correo electrónico.
   * Retorna la entidad rica de dominio User o null si no existe.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Busca un usuario por su identificador único UUID.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Verifica de forma rápida si un email ya se encuentra ocupado en el sistema.
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Registra un usuario nuevo en el sistema inyectando su hash de seguridad de forma aislada.
   * Diseñado específicamente para el caso de uso de Registro.
   */
  create(user: User, passwordHash: string): Promise<User>;

  /**
   * Sincroniza las mutaciones de estado de la entidad (perfil, roles) en la persistencia
   * y desencadena el despacho automático de eventos de dominio acumulados.
   */
  save(user: User): Promise<User>;

  /**
   * Recupera la entidad de dominio User junto con su hash de contraseña.
   * Método de uso exclusivo para el proceso de autenticación (Login).
   */
  findByEmailWithPassword(email: string): Promise<{ user: User; passwordHash: string } | null>;
}