// src/modules/auth/domain/repositories/IUserRepository.ts

export interface UserRecord {
  id: string;
  email: string;
  nombre: string;
  password_hash: string;
  rol: string;
  creado_en: Date;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  save(user: Omit<UserRecord, 'creado_en'>): Promise<UserRecord>;
  emailExists(email: string): Promise<boolean>;
  //Partial<Pick<UserRecord, 'email' | 'nombre'>> - Selecciona SOLO email y nombre, y los hace OPCIONALES.
  update(id: string, data: Partial<Pick<UserRecord, 'email' | 'nombre'>>): Promise<UserRecord>;
}