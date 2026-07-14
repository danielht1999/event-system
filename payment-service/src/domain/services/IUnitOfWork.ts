
export interface IUnitOfWork {
  execute<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
}
