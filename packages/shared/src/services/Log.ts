export function log(...args: any[]) {
    // eslint-disable-next-line no-console, @typescript-eslint/no-unsafe-argument
    if (import.meta.env.TV_DEBUG) console.log(...args)
}
