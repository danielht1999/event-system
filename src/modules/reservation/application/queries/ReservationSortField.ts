export const RESERVATION_SORT_FIELDS = [
  'createdAt',
  'status'
] as const;

export type ReservationSortField =
  typeof RESERVATION_SORT_FIELDS[number];