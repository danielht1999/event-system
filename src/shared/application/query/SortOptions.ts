// shared/application/query/SortOptions.ts

export type SortOrder = 'asc' | 'desc';

export interface SortOptions<TField extends string = string> {
  sortBy?: TField;
  sortOrder?: SortOrder;
}