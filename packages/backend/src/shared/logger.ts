export interface Logger {
  info(fields: Record<string, unknown>, message: string): void;
  error(fields: Record<string, unknown>, message: string): void;
}
export interface ServiceLogging {
  apiLogger: Logger;
  dbLogger: Logger;
}
