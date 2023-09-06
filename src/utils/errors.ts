export class NotFoundError extends Error {
  constructor(reason?: string) {
    super(`Couldn't found a stream: ${reason ?? 'not found'}`);
    this.name = 'NotFoundError';
  }
}
