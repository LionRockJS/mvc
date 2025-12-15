export default class Model {
    id = null;
    #states = [];
    constructor(id = null) {
        this.id = id;
        this.#states = [];
    }
    /**
   * states is a list of snapshots of the model.
   */
    getStates() {
        return this.#states;
    }
    snapshot() {
        this.#states.push({ ...this });
    }
}
Object.freeze(Model.prototype);
