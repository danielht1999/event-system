// src/modules/event/application/queries/GetEventsHandler.unit.test.ts

import { GetEventsHandler } from './GetEventsHandler';
import { IEventQueryService, EventoListDTO } from '../services/IEventQueryService';
import { PaginatedResult } from '@shared/application/query/PaginatedResult';
import { GetEventsQuery } from './GetEventsQuery';

describe('GetEventsHandler', () => {
  let eventQueryService: jest.Mocked<IEventQueryService>;
  let handler: GetEventsHandler;

  beforeEach(() => {
    // Ajustamos el mock a la nueva interfaz que solo tiene 'find'
    eventQueryService = {
      find: jest.fn(),
      findById: jest.fn(),      // Añadido para cumplir con la interfaz
      findManagement: jest.fn() // Añadido para cumplir con la interfaz
    } as jest.Mocked<IEventQueryService>;
    
    handler = new GetEventsHandler(eventQueryService);
  });

  test('debe retornar el resultado paginado del QueryService', async () => {
    const mockEvent: EventoListDTO = {
      id: 'event-1',
      titulo: 'Evento 1',
      lugar: 'Lugar 1',
      fecha: '2024-01-01T00:00:00.000Z',
      estado: 'PUBLICADO',
      precioMinimo: 100,
      cuposDisponibles: 50
    };

    const paginatedResult: PaginatedResult<EventoListDTO> = {
      items: [mockEvent],
      totalItems: 1,
      totalPages: 1,
      page: 1,
      limit: 20
    };

    const query: GetEventsQuery = { page: 1, limit: 20 };
    eventQueryService.find.mockResolvedValue(paginatedResult);

    const result = await handler.execute(query);

    expect(eventQueryService.find).toHaveBeenCalledWith(query);
    expect(result).toEqual(paginatedResult);
  });

  test('debe retornar estructura vacía cuando no existen eventos', async () => {
    const emptyResult: PaginatedResult<EventoListDTO> = {
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: 1,
      limit: 20
    };
    
    const query: GetEventsQuery = {};
    eventQueryService.find.mockResolvedValue(emptyResult);

    const result = await handler.execute(query);

    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  test('debe propagar errores del QueryService', async () => {
    const query: GetEventsQuery = {};
    eventQueryService.find.mockRejectedValue(new Error('DB Error'));
    
    await expect(handler.execute(query)).rejects.toThrow('DB Error');
  });
});