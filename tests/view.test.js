import View from '../classes/View.mjs';

describe('test View', () => {

  test('factory', async () => {
    const tpl = View.factory('student', { name: 'Alice' });
    const output = await tpl.render();

    expect(output.name).toBe('Alice');
  });

  test('direct assign variable to view', async () => {
    // pass data object will ignore direct assign variable (which is slower);
    const tpl = View.factory('student');
    tpl.data.club = 'art';

    const output = await tpl.render();
    expect(output.club).toBe('art');
  });

  test('view', async () => {
    const tpl = new View('student', { name: 'Alice' });
    const output = await tpl.render();
    expect(output.name).toBe('Alice');
  });

  test('cache', async () => {
    View.clearCache();
    expect(JSON.stringify(View.caches)).toBe('{}');
  });

  test('view base class cannot be freeze', async () => {

  });

  test('test prototype pollution', async () => {
    try{
      View.prototype.foo = () => 'bar';
      const ins = new View({});
      expect(ins.foo).toBe(undefined);
      expect('').toBe('this line should not be run');
    }catch(e){
      expect(/not extensible/.test(e.message)).toBe(true);
    }
  });

  test('view coverage', async () => {
    const v = new View();
    expect(v.file).toBe('');
    expect(v.defaultFile).toBe('');
    expect(JSON.stringify(v.data)).toBe('{}');
  });
});
