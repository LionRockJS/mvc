export default class Model {
  id: string | number | null = null;
  #states: any[] = [];

  constructor(id: string | number | null = null) {
    this.id = id;
    this.#states = [];
  }

  /**
 * states is a list of snapshots of the model.
 */
  getStates(): any[] {
    return this.#states;
  }

  snapshot(): void {
    this.#states.push({ ...this });
  }
}

Object.freeze(Model.prototype);