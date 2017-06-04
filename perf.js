const throat = require('./index');

const promises = [];
for (let i = 0; i < 1000000; i++) {
  promises.push(() => new Promise(resolve => process.nextTick(resolve)));
}

Promise.resolve().then(async () => {
  for (let amount = 10; amount <= 1000000; amount = amount * 10) {
    const list = promises.slice(0, amount);
    console.time(amount + ' promises');
    await Promise.all(list.map(throat(10, fn => fn())));
    console.timeEnd(amount + ' promises');
  }
});
