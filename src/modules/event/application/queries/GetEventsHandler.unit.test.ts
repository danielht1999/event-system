// src/modules/event/application/queries/GetEventsHandler.unit.test.ts

import { GetEventsHandler } from './GetEventsHandler';
import { IEventQueryService } from '../services/IEventQueryService';

describe('GetEventsHandler', () => {
  let eventQueryService: jest.Mocked<IEventQueryService>;
  let handler: GetEventsHandler;

  beforeEach(() => {
    eventQueryService = {
      findAll: jest.fn(),
      findByOrganizer: jest.fn()
    };

    handler = new GetEventsHandler(eventQueryService);
  });

  test('debe retornar los eventos entregados por el QueryService', async () => {
    const events = [
      {
        id: 'event-1',
        titulo: 'Evento 1'
      },
      {
        id: 'event-2',
        titulo: 'Evento 2'
      }
    ] as any;

    eventQueryService.findAll.mockResolvedValue(events);

    const result = await handler.execute();

    expect(eventQueryService.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(events);
  });

  test('debe retornar arreglo vacío cuando no existen eventos', async () => {
    eventQueryService.findAll.mockResolvedValue([]);

    const result = await handler.execute();

    expect(result).toEqual([]);
  });

  test('debe propagar errores del QueryService', async () => {
    eventQueryService.findAll.mockRejectedValue(
      new Error('DB Error')
    );

    await expect(
      handler.execute()
    ).rejects.toThrow('DB Error');
  });
});