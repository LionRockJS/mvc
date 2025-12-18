import { describe, expect, test } from 'bun:test';
import Controller from '../src/Controller.mts';
import ControllerMixin from '../src/ControllerMixin.mts';

class MA extends ControllerMixin {
  static async setup(state:Map<string, any>) {
    const client = state.get('client');
    if (client.ma === undefined) client.ma = 0;
    if (client.mabefore === undefined) client.mabefore = 0;
    if (client.mbefore === undefined) client.mbefore = 0;
    if (client.acount === undefined) client.acount = 0;
    client.ma += 1;
  }

  static async before(state:Map<string, any>) {
    const client = state.get('client');
    client.mbefore += 1;
    client.mabefore += 1;
  }

  static async action_a(state:Map<string, any>) {
    const client = state.get('client');
    client.a = true;
    client.acount += 1;
  }
}

class MB extends ControllerMixin {
  static async setup(state:Map<string, any>) {
    const client = state.get('client');
    if (client.mb === undefined) client.mb = 0;
    if (client.mbbefore === undefined) client.mbbefore = 0;
    if (client.mbefore === undefined) client.mbefore = 0;
    if (client.bcount === undefined) client.bcount = 0;
    client.mb += 1;
  }

  static async before(state:Map<string, any>) {
    const client = state.get('client');
    client.mbefore += 1;
    client.mbbefore += 1;
  }

  static async action_b(state:Map<string, any>) {
    const client = state.get('client');
    client.b = true;
    client.acount += 1;
  }
}

class CA extends Controller {
  static mixins = [...Controller.mixins, MA];
}

class CB extends CA {
  // eslint-disable-next-line class-methods-use-this
  async action_a() {}
}

class CA2 extends Controller {
  static mixins = [MA, MB];
  // eslint-disable-next-line class-methods-use-this
  async action_a() {}

  // eslint-disable-next-line class-methods-use-this
  async action_b() {}
}

class CB2 extends CA2 {
  // eslint-disable-next-line class-methods-use-this
  async action_a() {}

  // eslint-disable-next-line class-methods-use-this
  async action_b() {}
}

class CB3 extends CA2 {
  static mixins = [...CA2.mixins, MA]
  // eslint-disable-next-line class-methods-use-this
  async action_a() {}

  // eslint-disable-next-line class-methods-use-this
  async action_b() {}
}

class CCA extends Controller {
  static mixins = [...Controller.mixins, MA]
}

describe('test Controller', () => {
  test('not primitive class variable is funny when extend', async () => {
    class A{
      static foos: string[] = [];
    }

    class B extends A{}
    class C extends A{}

    (C as any).foos.push('foo')

    expect(A.foos).toBe(B.foos);
    expect(B.foos).toBe(C.foos);
  });

  test("clone class variable", async()=>{
    class A{
      static foos: string[] = [];
    }

    class B extends A{
      static foos = [...A.foos, "bar"]
    }

    class C extends A{}
    (C as any).foos = [...C.foos, "foo"];
    const cfoos = (C as any).foos;
    expect(cfoos[0]).toBe('foo');
    expect(B.foos).not.toBe(C.foos);
    expect(B.foos[0]).toBe('bar');
    expect(A.foos).not.toBe(B.foos);
  })

  test('test simple controller', async () => {
    const c:any = new CA({});
    c.action_a = async () => {};
    expect(c.ma).toBe(undefined);
    expect(c.mbefore).toBe(undefined);
    expect(c.mabefore).toBe(undefined);
    expect(c.a).not.toBe(true);
    await c.execute();
    expect(c.ma).toBe(1);
    expect(c.mabefore).toBe(1);
    expect(c.mbefore).toBe(1);
    expect(c.a).not.toBe(true);
  });

  test('test controller use static variable rather than Controller.mixin', async ()=>{
    const c:any = new CCA({});
    c.action_a = async () => {};
    expect(c.ma).toBe(undefined);
    expect(c.mbefore).toBe(undefined);
    expect(c.mabefore).toBe(undefined);
    expect(c.a).not.toBe(true);
    await c.execute();
    expect(c.ma).toBe(1);
    expect(c.mabefore).toBe(1);
    expect(c.mbefore).toBe(1);
    expect(c.a).not.toBe(true);
  })

  test('test simple controller, action match', async () => {
    const c:any = new CA({});
    c.action_a = async () => {};
    expect(c.ma).toBe(undefined);
    expect(c.mbefore).toBe(undefined);
    expect(c.mabefore).toBe(undefined);
    expect(c.a).not.toBe(true);
    await c.execute('a');
    expect(c.ma).toBe(1);
    expect(c.mabefore).toBe(1);
    expect(c.mbefore).toBe(1);
    expect(c.a).toBe(true);
  });

  test('multi mxin', async () => {
    const c:any = new CA2({});

    expect(c.ma).toBe(undefined);
    expect(c.mb).toBe(undefined);
    expect(c.mabefore).toBe(undefined);
    expect(c.mbbefore).toBe(undefined);
    expect(c.mbefore).toBe(undefined);
    expect(c.a).toBe(undefined);
    expect(c.b).toBe(undefined);

    await c.execute();
    expect(c.ma).toBe(1);
    expect(c.mb).toBe(1);
    expect(c.mabefore).toBe(1);
    expect(c.mbbefore).toBe(1);
    expect(c.mbefore).toBe(2);
    expect(c.a).toBe(undefined);
    expect(c.b).toBe(undefined);
  });

  test('multi mxin match a', async () => {
    const c:any = new CA2({});

    await c.execute('a');
    expect(c.ma).toBe(1);
    expect(c.mb).toBe(1);
    expect(c.mabefore).toBe(1);
    expect(c.mbbefore).toBe(1);
    expect(c.mbefore).toBe(2);
    expect(c.a).toBe(true);
    expect(c.b).toBe(undefined);
  });

  test('multi mxin match b', async () => {
    const c:any = new CA2({});

    await c.execute('b');
    expect(c.ma).toBe(1);
    expect(c.mb).toBe(1);
    expect(c.mabefore).toBe(1);
    expect(c.mbbefore).toBe(1);
    expect(c.mbefore).toBe(2);
    expect(c.a).toBe(undefined);
    expect(c.b).toBe(true);
  });

  test('inherit simple', async () => {
    const c:any = new CB({});

    expect(c.ma).toBe(undefined);
    expect(c.mabefore).toBe(undefined);
    expect(c.mbefore).toBe(undefined);
    expect(c.a).toBe(undefined);
    await c.execute();
    expect(c.ma).toBe(1);
    expect(c.mabefore).toBe(1);
    expect(c.mbefore).toBe(1);
    expect(c.a).toBe(undefined);
  });

  test('inherit simple match a', async () => {
    const c:any = new CB({});

    expect(c.ma).toBe(undefined);
    expect(c.mabefore).toBe(undefined);
    expect(c.mbefore).toBe(undefined);
    expect(c.a).toBe(undefined);
    await c.execute('a');
    expect(c.ma).toBe(1);
    expect(c.mabefore).toBe(1);
    expect(c.mbefore).toBe(1);
    expect(c.a).toBe(true);
  });

  test('inherit multi match b', async () => {
    const c:any = new CB2({});

    expect(c.ma).toBe(undefined);
    expect(c.mb).toBe(undefined);
    expect(c.mabefore).toBe(undefined);
    expect(c.mbbefore).toBe(undefined);
    expect(c.mbefore).toBe(undefined);
    expect(c.a).toBe(undefined);
    expect(c.b).toBe(undefined);

    await c.execute('b');
    expect(c.ma).toBe(1);
    expect(c.mb).toBe(1);
    expect(c.mabefore).toBe(1);
    expect(c.mbbefore).toBe(1);
    expect(c.mbefore).toBe(2);
    expect(c.a).toBe(undefined);
    expect(c.b).toBe(true);
  });

  test('inherit multi multi match a', async () => {
    const c:any = new CB3({});

    expect(c.ma).toBe(undefined);
    expect(c.mb).toBe(undefined);
    expect(c.mabefore).toBe(undefined);
    expect(c.mbbefore).toBe(undefined);
    expect(c.mbefore).toBe(undefined);
    expect(c.a).toBe(undefined);
    expect(c.b).toBe(undefined);

    await c.execute('a');
    expect(c.ma).toBe(2);
    expect(c.mb).toBe(1);
    expect(c.mabefore).toBe(2);
    expect(c.mbbefore).toBe(1);
    expect(c.mbefore).toBe(3);
    expect(c.a).toBe(true);
    expect(c.b).toBe(undefined);
    expect(c.acount).toBe(2);
  });
});
