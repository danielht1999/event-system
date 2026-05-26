// src/modules/event/application/queries/GetEventsByOrganizerHandler.ts
import { IEventQueryService, EventDTO } from '../services/IEventQueryService';

export class GetEventsByOrganizerHandler {
  constructor(
    private eventQueryService: IEventQueryService
  ) {}

  async execute(organizerId: string): Promise<EventDTO[]> {
    return await this.eventQueryService.findByOrganizer(organizerId);
  }
}