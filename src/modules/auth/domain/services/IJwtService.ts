// src/modules/auth/infrastructure/services/IJwtService.ts
export interface IJwtService {
  sign(payload: { id: string; email: string; rol: string }): string;
  verify(token: string): { id: string; email: string; rol: string } | null;
}
