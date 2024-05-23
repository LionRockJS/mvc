/**
 * Copyright (c) 2022 Kojin Nakana
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export default class View {
  static DefaultViewClass = View;

  static caches = {}

  static factory(file, data = {}) {
    return new this.DefaultViewClass(file, data);
  }

  static clearCache() {
    this.caches = {};
  }

  constructor(file="", data={}) {
    this.file = file;
    this.data = data;
  }

  async render() {
    return this.data;
  }
}

Object.freeze(View.prototype);