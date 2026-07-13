import { Router, Request, Response, NextFunction } from 'express';
import { CreatePaymentHandler } from '../../application/commands/CreatePaymentHandler';
import { CreatePaymentCommand } from '../../application/commands/CreatePaymentCommand';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { hmacAuth } from '../middlewares/hmacAuth';
import { validateBody, validateParams, createPaymentSchema, paymentIdParamSchema } from '../middlewares/validation';
import { CreatePaymentRequestDTO, CreatePaymentResponseDTO, PaymentResponseDTO } from '../dtos/PaymentDTOs';
import { PaymentNotFoundError } from '../../domain/errors';

export function buildPaymentsRouter(
  createPaymentHandler: CreatePaymentHandler,
  paymentRepository: IPaymentRepository,
  hmacSecret: string,
): Router {
  const router = Router();

  router.post(
    '/payments',
    hmacAuth(hmacSecret),
    validateBody(createPaymentSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as CreatePaymentRequestDTO;
        const idempotencyKey = req.header('Idempotency-Key');
        if (!idempotencyKey) {
          res.status(400).json({
            status: 'fail',
            category: 'VALIDATION',
            code: 'MISSING_IDEMPOTENCY_KEY',
            message: 'El header Idempotency-Key es requerido.',
          });
          return;
        }

        const result = await createPaymentHandler.execute(
          new CreatePaymentCommand(body.reservationId, body.usuarioId, body.amountCents, body.currency, idempotencyKey),
        );

        const response: CreatePaymentResponseDTO = result;
        res.status(201).json(response);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/payments/:id',
    hmacAuth(hmacSecret),
    validateParams(paymentIdParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const payment = await paymentRepository.findById(req.params.id);
        if (!payment) {
          throw new PaymentNotFoundError(req.params.id);
        }

        const response: PaymentResponseDTO = {
          paymentId: payment.id,
          reservationId: payment.reservationId,
          status: payment.estado,
          amountCents: payment.money.amountCents,
          currency: payment.money.currency,
          providerReference: payment.providerReference ?? null,
          createdAt: payment.creadoEn.toISOString(),
          updatedAt: payment.actualizadoEn.toISOString(),
        };
        res.status(200).json(response);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
