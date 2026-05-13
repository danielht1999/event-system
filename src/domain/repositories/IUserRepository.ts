// src/domain/repositories/IUserRepository.ts
export interface User {
  id: string;
  email: string;
  nombre: string;
  password_hash: string;
  rol: string;  
  creado_en: Date;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: Omit<User, 'creado_en'>): Promise<User>;
  emailExists(email: string): Promise<boolean>;
}
