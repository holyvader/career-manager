export function cx(
  ...args: (
    | string
    | boolean
    | undefined
    | null
    | Record<string, boolean | string>
  )[]
): string {
  return args
    .map((arg) => {
      if (typeof arg === 'string') {
        return arg;
      }
      if (typeof arg === 'object' && arg !== null) {
        return Object.entries(arg)
          .filter(([_, value]) => Boolean(value))
          .map(([key, _]) => key)
          .join(' ');
      }
      return undefined;
    })
    .filter(Boolean)
    .join(' ')
    .trimEnd();
}
