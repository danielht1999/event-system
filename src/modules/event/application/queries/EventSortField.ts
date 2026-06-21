export const EVENT_SORT_FIELDS = [
  'createdAt',
  'title',
  'eventDate'
] as const;

export type EventSortField =
  typeof EVENT_SORT_FIELDS[number];