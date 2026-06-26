export class NexusError extends Error {
  public statusCode: number;
  public errors?: any;

  constructor(message: string, statusCode = 500, errors?: any) {
    super(message);
    this.name = "NexusError";
    this.statusCode = statusCode;
    this.errors = errors;

    Object.setPrototypeOf(this, NexusError.prototype);

    // ⚠️ backend এর ApiError.ts তে Error.captureStackTrace ব্যবহার করা হয়েছে,
    // কিন্তু এটা V8/Node-specific API। Chrome-based browser এ কাজ করে,
    // Safari/Firefox এ করে না — তাই frontend এ optional guard দিয়ে রাখছি।
    if (typeof (Error as any).captureStackTrace === "function") {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

export const showError = (error: unknown, customMsg?: string) => {
  if (isNexusError(error)) {
    alert(error.message || customMsg);
  } else {
    alert(customMsg || "An unexpected error occurred");
  }
};

export const nexusError = (error: unknown): string | undefined => {
  return isNexusError(error) ? error.message : undefined;
};

export const isNexusError = (error: unknown): error is NexusError => {
  return error instanceof NexusError;
};

export const isNexusStatus = (error: unknown, statusCode: number): boolean => {
  return isNexusError(error) && error.statusCode === statusCode;
};

export const notNexusError = (error: unknown): boolean => {
  return !isNexusError(error);
};

export const notNexusStatus = (error: unknown, statusCode: number): boolean => {
  return notNexusError(error) || (isNexusError(error) && error.statusCode !== statusCode);
};