import { IReservationQueryService } from '../services/IReservationQueryService';
import { GetReservationsQuery } from './GetReservationsQuery';
import { PaginatedResult } from '@shared/application/query/PaginatedResult';
import { ReservationDTO } from '../services/IReservationQueryService';

export class GetReservationsHandler {
  constructor(private readonly reservationQueryService: IReservationQueryService) {}

  async execute(query: GetReservationsQuery): Promise<PaginatedResult<ReservationDTO>> {
    return this.reservationQueryService.getReservations(query);
  }
}