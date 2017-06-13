const spawnSync = require('child_process').spawnSync;

test('typescript', () => {
  const result = spawnSync('npm', ['run', 'tsc']);
  expect(result.status).toBe(1);
  expect(result.stdout.toString('utf8').split('\n').filter(l => !/^\>/.test(l)).join('\n')).toMatchSnapshot();
});
