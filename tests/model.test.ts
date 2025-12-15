import Model from '../src/Model.mjs';
import { describe, expect, test } from 'bun:test';

class TestModel extends Model{
  public foo:string;
 
  constructor(id:string|number|null=null, foo:string='bar'){
    super(id);
    this.foo = foo;
  }
}

describe('test View', () => {
  test('snapshot', async () => {
    const Test = new TestModel(1, 'baz');
    expect(Test.getStates().length).toBe(0);

    Test.snapshot();
    expect(Test.getStates().length).toBe(1);
    expect(Test.getStates()[0].foo).toBe('baz');

    Test.foo = 'qux';
    Test.snapshot();
    expect(Test.getStates()[0].foo).toBe('baz');
    expect(Test.getStates().length).toBe(2);
    expect(Test.getStates()[1].foo).toBe('qux');    
  });

})