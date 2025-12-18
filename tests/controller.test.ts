import { describe, expect, test, beforeEach } from 'bun:test';
import Controller, { ControllerState, Request } from '../src/Controller.mts';
import ControllerMixin from '../src/ControllerMixin.mts';

class TestController extends Controller {
  // eslint-disable-next-line class-methods-use-this
  async action_error() {
    throw new Error('test error');
  }

  async action_error2(){
    throw new Error();
  }
}

class TestMixin extends ControllerMixin {
  static init(state:Map<any, any>) {
    state.set('foo', 'bar');
    state.set('who', this);
    state.set('name', this.name);
  }

  static async action_error() {
    throw new Error('Expected Error');
  }

  static async action_test1(state:Map<any, any>) {
    state.set('name', 'hello 1');
  }

  static async action_test3(state:Map<any, any>) {
    state.set('name', 'ouch 1');
  }
}

class TestMixin2 extends ControllerMixin {
  static async action_test2(state:Map<any, any>) {
    state.set('name', 'hello 2');
  }

  static async action_test3(state:Map<any, any>) {
    state.set('name', 'ouch 2');
  }
}

class TestMixin3 extends ControllerMixin {
  static async init(state:Map<any, any>) {
    state.set('foo', 'tar');
  }
}

class TestMixin4 extends ControllerMixin {
  static async action_test2() {
  }
}

class TestMixinStopAtBefore extends ControllerMixin {
  static async before(state:Map<any, any>) {
    state.get('client').exit(503);
  }
}

class TestMixinStopAtAction extends ControllerMixin {
  static async action_test2(state:Map<any, any>) {
    state.get('client').exit(503);
  }
}

class TestMixinStopAtAfter extends ControllerMixin {
  static async after(state:Map<any, any>) {
    state.get('client').exit(503);
  }
}

describe('test Controller', () => {
  beforeEach(() => {

  });

  test('test prototype pollution', async () => {
    try{
      Controller.prototype.foo = () => 'bar';
      const ins:any = new Controller({});
      expect(ins.foo).toBe(undefined);
      expect('').toBe('this line should not be run');
    }catch(e){
      expect(/not extensible/.test(e.message)).toBe(true);
    }
  });

  test('add mixin', async () => {
    class C extends Controller {
      static mixins = [...Controller.mixins, TestMixin]
    }

    const ins = new C({});
    expect(ins.state.get('foo')).toBe('bar');

    const ins2 = new Controller({});
    expect(ins2.state.get('foo')).toBe(undefined);
  });

  test('get default action', async () => {
    class C extends Controller {
      body = "";

      async action_index() {
        this.body = 'index';
      }
    }

    const ins = new Controller({});
    const res = await ins.execute();
    expect(res.body).toBe('');

    const ins2 = new C({});
    await ins2.execute();
    expect(ins2.body).toBe('index');
  });

  test('get empty params', async () => {
    class C extends Controller {
      body = "";
      async action_index() {
        this.body = 'index';
      }
    }

    const ins = new C({ params: {} });
    await ins.execute();
    expect(ins.body).toBe('index');
  });

  test('specific action', async () => {
    class C extends Controller {
      body = "";
      async action_hello() {
        this.body = 'hello';
      }
    }

    const ins = new C({ params: {} });
    await ins.execute('hello');
    expect(ins.body).toBe('hello');
  });

  test('call execture multiple time', async () => {
    class C extends Controller {
      count = 0;
      body = '';

      async action_hello() {
        this.count += 1;
        this.body = 'hello';
      }
    }

    const ins = new C({ params: {} });
    await ins.execute('hello');
    expect(ins.body).toBe('hello');
    expect(ins.count).toBe(1);

    await ins.execute('hello');
    expect(ins.body).toBe('hello');
    expect(ins.count).toBe(2);
  });

  test('unknown action', async () => {
    const ins = new Controller({ params: { action: 'read' } });
    const res = await ins.execute();
    expect(res.status).toBe(404);
  });

  test('server error', async () => {
    class C extends TestController {
      static mixins = [...TestController.mixins, TestMixin]
    }

    const ins = new C({});
    const res = await ins.execute('error');
    expect(res.status).toBe(500);
    expect(res.body).toBe('Expected Error');
  });

  test('server error with body', async () => {
    class C extends TestController {
      static mixins = [...TestController.mixins, TestMixin]
    }
    const ins = new C({});
    ins.state.set(ControllerState.BODY, 'hello');
    const res = await ins.execute('error');
    expect(res.status).toBe(500);
    expect(res.body).toBe('hello');
  });

  test('server error without body', async () => {
    const ins = new TestController({});
    const res = await ins.execute('error');
    expect(res.status).toBe(500);
    expect(res.body).toBe('test error');

    const ins2 = new TestController({});
    const res2 = await ins2.execute('error2');
    expect(res2.status).toBe(500);
    expect(res2.body).toBe('500 / Internal Server Error');
  });

  test('redirect', async () => {
    const ins = new Controller({});
    await ins.redirect('http://example.com');
    expect(ins.state.get(ControllerState.STATUS)).toBe(302);
  });

  test('forbidden', async () => {
    const ins = new Controller({});
    await ins.forbidden('No popo allowed');
    expect(ins.state.get(ControllerState.STATUS)).toBe(403);
  });

  test('not found default message', async () => {
    const ins = new Controller({});
    const res = await ins.execute('not_exist');
    expect(res.status).toBe(404);
    expect(res.body).toBe('404 / Controller::action_not_exist not found');
  });

  test('forbidden default message', async () => {
    const ins = new Controller({});
    await ins.forbidden();
    expect(ins.state.get(ControllerState.BODY)).toBe('403 / ');
    expect(ins.state.get(ControllerState.STATUS)).toBe(403);
  });

  test('mixin this', async () => {
    class C extends Controller {
      static mixins = [...Controller.mixins, TestMixin]
    }

    const ins = new C({});
    expect(ins.state.get('who').name).toBe('TestMixin');
  });

  test('branch mixin result', async () => {
    class C extends Controller {
      static mixins = [...Controller.mixins, TestMixin, TestMixin2]
    }

    const ins:any = new C({});
    ins.action_test1 = async () => {};

    await ins.execute('test1', true);

    expect(ins.state.get('name')).toBe('hello 1');
  });

  test('branch mixin result 2', async () => {
    class C extends Controller {
      static mixins = [...Controller.mixins, TestMixin, TestMixin2]
    }

    const ins:any = new C({});
    ins.action_test2 = async () => {};
    await ins.execute('test2', true);

    expect(ins.state.get('name')).toBe('hello 2');
  });

  test('branch mixin result 3', async () => {
    class C extends Controller {
      static mixins = [...Controller.mixins, TestMixin3, TestMixin2]
    }

    const ins:any = new C({});
    ins.action_test3 = async () => {};
    await ins.execute('test3');

    try {
      ins.state.get('name');
    } catch (e:any) {
      expect(e.message).toBe('conflict mixin export value found: (ouch 2) , (ouch 1)');
    }
  });

  test('mixinAction', async () => {
    class C extends Controller {
      static mixins = [...Controller.mixins, TestMixin, TestMixin2]
    }

    const ins:any = new C({});
    ins.action_test4 = async () => {
      await ins.mixinsAction('action_test2');
    };

    await ins.execute('test4', true);

    expect(ins.state.get('name')).toBe('hello 2');
  });

  test('allow unknown action', async () => {
    class C extends Controller {
      static mixins = [...Controller.mixins, TestMixin, TestMixin2]
      static suppressActionNotFound = true;
    }

    const ins = new C({});

    await ins.execute('test2', true);

    expect(ins.state.get('name')).toBe('hello 2');
  });

  test('stop other mixins - before', async () => {
    class C extends Controller {
      static mixins = [...Controller.mixins, TestMixinStopAtBefore, TestMixin];
      static suppressActionNotFound = true;
    }

    const ins = new C({});
    const result = await ins.execute('test2');

    expect(result.status).toBe(503);
  });

  test('stop other mixins - action', async () => {
    class C extends Controller{
      static mixins = [TestMixinStopAtAction, TestMixin]
      static suppressActionNotFound = true;
    }

    const ins = new C({});

    const result = await ins.execute('test2');

    expect(result.status).toBe(503);
  });

  test('stop other mixins - after', async () => {
    class C extends Controller {
      static mixins = [TestMixinStopAtAfter, TestMixin]
      static suppressActionNotFound = true;
    }

    const ins = new C({});
    const result = await ins.execute('test2');

    expect(result.status).toBe(503);
  });

  test('override mixin export constant', async () => {
    class C extends Controller {
      static mixins = [TestMixin, TestMixin3]
      static suppressActionNotFound = true;
    }
    const ins = new C({});
    expect(ins.state.get('foo')).toBe('tar');
  });

  test('mixin override export thrice', async () => {
    class C extends Controller {
      static mixins = [TestMixin, TestMixin2, TestMixin2]
      static suppressActionNotFound = true;
    }

    const ins = new C({});
    await ins.execute('test2', true);

    expect(ins.state.get('name')).toBe('hello 2');
  });

  test('mixin export multiple values', async () => {
    class C extends Controller {
      static mixins = [TestMixin, TestMixin2, TestMixin4, TestMixin2];
      static suppressActionNotFound = true;
    }

    const ins = new C({});
    await ins.execute('test2', true);

    expect(ins.state.get('name')).toBe('hello 2');
  });

  test('header sent in constructor', async () => {
    class C extends Controller {
      static mixins = [TestMixin, TestMixin2, TestMixin4, TestMixin2];
      static suppressActionNotFound = true;
    }
    const ins = new C({});

    await ins.forbidden('quit');
    const res = await ins.execute('test2');

    expect(res.status).toBe(403);
  });

  test('client IP', async () => {
    const c = new Controller({});
    await c.execute(null, true);
    expect(c.state.get(ControllerState.CLIENT_IP)).toBe('0.0.0.0');

    const c1 = new Controller({ headers: { 'cf-connecting-ip': '0.0.0.1' } });
    await c1.execute(null, true);
    expect(c1.state.get(ControllerState.CLIENT_IP)).toBe('0.0.0.1');

    const c2 = new Controller({ headers: { 'x-real-ip': '0.0.0.2' } });
    await c2.execute(null, true);
    expect(c2.state.get(ControllerState.CLIENT_IP)).toBe('0.0.0.2');

    const c3 = new Controller({ headers: { 'x-forwarded-for': '0.0.0.3' } });
    await c3.execute(null, true);
    expect(c3.state.get(ControllerState.CLIENT_IP)).toBe('0.0.0.3');

    const c4 = new Controller({ headers: { remote_addr: '0.0.0.4' } });
    await c4.execute(null, true);
    expect(c4.state.get(ControllerState.CLIENT_IP)).toBe('0.0.0.4');

    const c5 = new Controller({ headers: {}, ip: '0.0.0.5' });
    await c5.execute(null, true);
    expect(c5.state.get(ControllerState.CLIENT_IP)).toBe('0.0.0.5');
  });

  test('inheritage', async () => {
    class M1 extends ControllerMixin {
      static async setup(state:Map<any, any>) {
        const client = state.get('client');
        client.value += 1;
      }

      static action_foo(state:Map<any, any>) {
        const client = state.get('client');
        client.foo = true;
      }
    }
    class M2 extends ControllerMixin {
      static async setup(state:Map<any, any>) {
        const client = state.get('client');
        client.value += 1;
      }

      static action_bar(state:Map<any, any>) {
        const client = state.get('client');
        client.bar = true;
      }
    }

    class A extends Controller {
      static mixins = [M1]
      value = 0;
      foo;
      bar;
      body = '';

      constructor(request:Request) {
        super(request);
        this.foo = false;
        this.bar = false;
      }

      async action_foo() {
        this.body = 'foo';
      }

      async action_bar() {
        this.body = 'bar';
      }
    }

    class B extends A {
      static mixins = [...super.mixins, M1]
    }

    class C extends B {
      static mixins = [...super.mixins, M1, M2]
    }

    const b0 = new B({});
    await b0.execute(null,true);
    expect(b0.value).toBe(2);

    const c0 = new C({});
    await c0.execute(null,true);
    expect(c0.value).toBe(4);

    const c1 = new C({});
    await c1.execute(null,true);
    expect(c1.value).toBe(4);

    const b1 = new B({});
    await b1.execute(null,true);
    expect(b1.value).toBe(2);

    await b0.execute('foo',true);
    expect(b0.foo).toBe(true);
    await b1.execute('bar',true);

    expect(b1.bar).toBe(false);

    await c0.execute('foo',true);
    expect(c0.foo).toBe(true);
    await c1.execute('bar',true);
    expect(c1.bar).toBe(true);
  });

  test('inheritage form B', async () => {
    class M1 extends ControllerMixin {
      static async setup(state:Map<any, any>) {
        const client = state.get('client');
        client.value += 1;
      }
    }

    class A extends Controller {
      static mixins = [M1]
      value = 0;
    }

    class B extends A {
      static mixins = [...super.mixins, M1]
    }

    class C extends B {
      static mixins = [...super.mixins, M1]
    }

    const c0 = new C({});
    await c0.execute();
    expect(c0.value).toBe(3);

    const c1 = new C({});
    await c1.execute();
    expect(c1.value).toBe(3);

    const b0 = new B({});
    await b0.execute();
    expect(b0.value).toBe(2);
  });

  test("redirect keep query string", async () => {
    class TestRedirectController extends Controller {
      // eslint-disable-next-line class-methods-use-this
      async action_index() {
        await c.redirect('https://example.com', true);
      }
    }

    const c = new TestRedirectController({query:{utm_source: "test"}});
    await c.execute(null,true);

    expect(c.state.get(ControllerState.HEADERS).location).toBe('https://example.com?utm_source=test');
  })

  test("redirect add query string", async () => {
    class TestRedirectController extends Controller {
      // eslint-disable-next-line class-methods-use-this
      async action_index() {
        await c.redirect('https://example.com?target=1', true);
      }
    }

    const c = new TestRedirectController({query:{utm_source: "test"}});
    await c.execute(null,true);

    expect(c.state.get(ControllerState.HEADERS).location).toBe('https://example.com?target=1&utm_source=test');
  })

  test("redirect without query string", async () => {
    class TestRedirectController extends Controller {
      // eslint-disable-next-line class-methods-use-this
      async action_index() {
        await c.redirect('https://example.com?target=1', true);
      }
    }

    const c = new TestRedirectController({query:{}});
    await c.execute(null,true);

    expect(c.state.get(ControllerState.HEADERS).location).toBe('https://example.com?target=1');
  })

  test('coverage, test action name', async () => {
    //default
    const c1 = new Controller({});
    await c1.execute(null,true);
    expect(c1.state.get(ControllerState.FULL_ACTION_NAME)).toBe('action_index');
    expect(c1.state.get(ControllerState.ACTION)).toBe(undefined);

    //from request
    const c2 = new Controller({params: {action: 'foo'}});
    await c2.execute(null,true);
    expect(c2.state.get(ControllerState.FULL_ACTION_NAME)).toBe('action_foo');

    //direct access
    const c3 = new Controller({});
    await c3.execute('bar',true);
    expect(c3.state.get(ControllerState.FULL_ACTION_NAME)).toBe('action_bar');

    //direct access, with request action
    const c4 = new Controller({params: {action: 'foo'}});
    await c4.execute('tar',true);
    expect(c4.state.get(ControllerState.FULL_ACTION_NAME)).toBe('action_tar');
  });

  test('assign state from constructor', async () =>{
    class TestPreStateController extends Controller {
      constructor(request:Request) {
        super(request, new Map([['foo', 'bar']]));
      }
      // eslint-disable-next-line class-methods-use-this
      async action_index() {
        await c.redirect('https://example.com?target=1', true);
      }
    }

    const c = new TestPreStateController({query:{}});
    await c.execute(null,true);

    expect(c.state.get('foo')).toBe('bar');
  })

  test('coverage, client ip', async () => {
    const c0 = new Controller({
      headers:{
      }
    });
    await c0.execute(null,true);
    expect(c0.state.get(ControllerState.CLIENT_IP)).toBe('0.0.0.0');

    const c1 = new Controller({
      headers:{
        'cf-connecting-ip': '666.777.888.999',
      }
    });
    await c1.execute(null,true);
    expect(c1.state.get(ControllerState.CLIENT_IP)).toBe('666.777.888.999');

    const c2 = new Controller({
      headers:{
        'x-real-ip': '622.722.822.922',
      }
    });
    await c2.execute(null,true);
    expect(c2.state.get(ControllerState.CLIENT_IP)).toBe('622.722.822.922');
  });
});
