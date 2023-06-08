import Model from '../classes/Model';
import Controller from "../classes/Controller";

class TestModel extends Model {
}

describe('test Model', () => {
  test('test prototype pollution', async () => {
    try{
      Model.prototype.foo = () => 'bar';
      const ins = new Model({});
      expect(ins.foo).toBe(undefined);
      expect('').toBe('this line should not be run');
    }catch(e){
      expect(e.message).toBe('Cannot add property foo, object is not extensible');
    }
  });

  test('test child class', () => {
    TestModel.prototype.foo = () => 'bar';
    const ins = new TestModel();
    expect(ins.foo()).toBe('bar');
  });
});
