// src/modules/event/application/queries/GetEventsHandler.ts
import { IEventQueryService, EventDTO } from '../services/IEventQueryService';

export class GetEventsHandler {
  constructor(
    private eventQueryService: IEventQueryService
  ) {}

  async execute(): Promise<EventDTO[]> {
    return await this.eventQueryService.findAll();
  }
}