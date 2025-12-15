export default class Model {
    #private;
    id: string | number | null;
    constructor(id?: string | number | null);
    /**
   * states is a list of snapshots of the model.
   */
    getStates(): any[];
    snapshot(): void;
}
