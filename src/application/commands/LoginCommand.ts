// application/commands/LoginCommand.ts
export class LoginCommand {
  readonly email: string;
  readonly password: string;

  constructor(data: { email: string; password: string }) {
    if (!data.email || !data.password) {
      throw new Error('Email y password requeridos');
    }
    this.email = data.email.toLowerCase();
    this.password = data.password;
  }
}
