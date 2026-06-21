import pool from '@shared/infrastructure/database/connection';
import { PostgresTicketTypeRepository } from './PostgresTicketTypeRepository';
import { TicketType } from '../../domain/entities/TicketType';
import { Capacity } from '../../domain/value-objects/Capacity';

jest.mock('@shared/infrastructure/database/connection', () => ({
  query: jest.fn()
}));

describe('PostgresTicketTypeRepository', () => {
  let repository: PostgresTicketTypeRepository;

  beforeEach(() => {
    repository = new PostgresTicketTypeRepository();
    jest.clearAllMocks();
  });

  describe('save()', () => {
    it('debería guardar un TicketType pasando los parámetros completos', async () => {
      // CORRECCIÓN: Usamos reconstruct para instancias ya persistidas
      const ticketType = TicketType.reconstruct(
        'ticket-1',
        'event-1',
        'VIP',
        150,
        new Capacity(100),
        0,
        0,
        'ACTIVO',
        new Date()
      );

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: 'ticket-1',
            evento_id: 'event-1',
            nombre: 'VIP',
            precio: '150',
            capacidad_maxima: 100,
            reservas_pendientes: 0,
            reservas_confirmadas: 0,
            estado: 'ACTIVO',
            creado_en: new Date()
          }
        ]
      });

      const result = await repository.save(ticketType);

      expect(pool.query).toHaveBeenCalled();
      expect(result.id).toBe(ticketType.id);
      expect(result.eventId).toBe(ticketType.eventId);
      expect(result.nombre).toBe(ticketType.nombre);
    });
  });

  describe('findById()', () => {
    it('debería retornar TicketType existente', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: 'ticket-1',
            evento_id: 'event-1',
            nombre: 'General',
            precio: '100',
            capacidad_maxima: 200,
            reservas_pendientes: 0,
            reservas_confirmadas: 0,
            estado: 'ACTIVO',
            creado_en: new Date()
          }
        ]
      });

      const result = await repository.findById('ticket-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('ticket-1');
    });

    it('debería retornar null si no existe', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: []
      });

      const result = await repository.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('findByEventId()', () => {
    it('debería retornar tickets asociados al evento', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: 'ticket-1',
            evento_id: 'event-1',
            nombre: 'General',
            precio: '100',
            capacidad_maxima: 200,
            reservas_pendientes: 0,
            reservas_confirmadas: 0,
            estado: 'ACTIVO',
            creado_en: new Date()
          }
        ]
      });

      const result = await repository.findByEventId('event-1');

      expect(result).toHaveLength(1);
    });
  });
});