// src/modules/event/application/queries/GetEventsByOrganizerHandler.unit.test.ts

import { GetEventsByOrganizerHandler } from './GetEventsByOrganizerHandler';
import { IEventQueryService } from '../services/IEventQueryService';

describe('GetEventsByOrganizerHandler', () => {
  let eventQueryService: jest.Mocked<IEventQueryService>;
  let handler: GetEventsByOrganizerHandler;

  beforeEach(() => {
    eventQueryService = {
      findAll: jest.fn(),
      findByOrganizer: jest.fn()
    };

    handler = new GetEventsByOrganizerHandler(
      eventQueryService
    );
  });

  test('debe retornar los eventos del organizador indicado', async () => {
    const organizerId = 'organizer-123';

    const events = [
      {
        id: 'event-1',
        organizadorId: organizerId
      },
      {
        id: 'event-2',
        organizadorId: organizerId
      }
    ] as any;

    eventQueryService.findByOrganizer.mockResolvedValue(
      events
    );

    const result = await handler.execute(
      organizerId
    );

    expect(
      eventQueryService.findByOrganizer
    ).toHaveBeenCalledWith(
      organizerId
    );

    expect(result).toEqual(events);
  });

  test('debe retornar arreglo vacío si el organizador no tiene eventos', async () => {
    eventQueryService.findByOrganizer.mockResolvedValue(
      []
    );

    const result = await handler.execute(
      'organizer-123'
    );

    expect(result).toEqual([]);
  });

  test('debe propagar errores del QueryService', async () => {
    eventQueryService.findByOrganizer.mockRejectedValue(
      new Error('DB Error')
    );

    await expect(
      handler.execute('organizer-123')
    ).rejects.toThrow('DB Error');
  });
});