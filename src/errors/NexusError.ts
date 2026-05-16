export class NexusError extends Error {
  statusCode: number;
  errors?: any;

  constructor(message: string, statusCode: number, errors?: any) {
    super(message);
    this.name = "NexusError";
    this.statusCode = statusCode;
    this.errors = errors;

    Object.setPrototypeOf(this, NexusError.prototype);
  }
}

export function isNexusError(error: unknown): error is NexusError {
  return error instanceof NexusError;
}