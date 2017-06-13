import throat = require('../');

const adderA = throat(5, (a: number, b: number) => Promise.resolve(a + b));

const a: Promise<number> = adderA(1, 2);
const aFail: Promise<number> = adderA(1, 'foo');
const aFail2: Promise<string> = adderA(1, 2);

const adderB = throat((a: number, b: number) => Promise.resolve(a + b), 5);

const b: Promise<number> = adderB(1, 2);
const bFail: Promise<number> = adderB(1, 'foo');
const bFail2: Promise<string> = adderB(1, 2);

const throttle = throat(5);

const t: Promise<number> = throttle(() => Promise.resolve(5));
const t2: Promise<string> = throttle(() => Promise.resolve('foo'));
const tFail: Promise<number> = throttle((x: number) => Promise.resolve(x));
const tFail2: Promise<string> = throttle((x: string) => Promise.resolve(x));
const tFail3: Promise<string> = throttle(() => Promise.resolve(5));
