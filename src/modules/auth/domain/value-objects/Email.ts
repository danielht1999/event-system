// src/modules/auth/domain/value-objects/Email.ts
export class Email {
  private readonly _value: string;

  constructor(email: string) {
    // 1. Defensa inicial contra nulos, indefinidos o vacíos
    if (!email || typeof email !== 'string') {
      throw new Error('El email es requerido y debe ser una cadena de texto');
    }

    // 2. Sanitización inmediata: Limpiamos espacios y estandarizamos a minúsculas
    const sanitizedEmail = email.trim().toLowerCase();

    // 3. Validación sobre el valor limpio
    if (!this.isValid(sanitizedEmail)) {
      throw new Error(`Email inválido: ${email}`);
    }

    this._value = sanitizedEmail;
  }

  private isValid(email: string): boolean {
    // Tu regex actual es excelente para interceptar estructuras reales sin falsos positivos comunes
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return emailRegex.test(email);
  }

  get value(): string {
    return this._value;
  }

  public equals(other: Email): boolean {
    return this._value === other.value;
  }
}