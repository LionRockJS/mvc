/**
 * Copyright (c) 2022 Kojin Nakana
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export default class View {
    static DefaultViewClass = View;
    file;
    data;
    defaultFile;
    static factory(file, data = {}) {
        return new this.DefaultViewClass(file, data);
    }
    constructor(file = "", data = {}, defaultFile = "") {
        this.file = file;
        this.data = data;
        this.defaultFile = defaultFile;
    }
    async render() {
        return this.data;
    }
}
Object.freeze(View.prototype);
