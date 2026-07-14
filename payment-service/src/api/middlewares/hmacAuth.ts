import { Request, Response, NextFunction } from 'express';
import { HmacVerifier } from '../../infrastructure/security/HmacVerifier';
import { InvalidHmacSignatureError } from '../../domain/errors';

// Aumenta Request con el body crudo capturado en server.ts (express.json verify),
// necesario porque la firma se calcula sobre los bytes exactos recibidos.
declare module 'express-serve-static-core' {
  interface Request {
    rawBody?: Buffer;
  }
}

export function hmacAuth(secret: string) {
  const verifier = new HmacVerifier(secret);

  return (req: Request, _res: Response, next: NextFunction): void => {
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : '';
    const timestamp = req.header('X-Timestamp');
    const signature = req.header('X-Signature');

    const isValid = verifier.verify(rawBody, timestamp, signature);
    if (!isValid) {
      next(new InvalidHmacSignatureError());
      return;
    }
    next();
  };
}
