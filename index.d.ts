declare const throat: Throttle & { (p: typeof Promise): Throttle };

interface Throttle {
    <TResult, TFn extends (...args: Array<any>) => Promise<TResult>>(size: number, fn: TFn): TFn;
    <TResult, TFn extends (...args: Array<any>) => Promise<TResult>>(fn: TFn, size: number): TFn;
    (size: number): <TResult>(fn: () => Promise<TResult>) => Promise<TResult>;
}

export = throat;
