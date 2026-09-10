// Expected application failures; controllers translate these into HTTP responses.
export class ServiceError<const Code extends number, const Body> {
  constructor(
    public readonly code: Code,
    public readonly body: Body,
  ) {}
}
export function failure<const Code extends number, const Body>(
  code: Code,
  body: Body,
) {
  return new ServiceError(code, body);
}
