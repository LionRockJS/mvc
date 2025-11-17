/**
 * Copyright (c) 2022 Kojin Nakana
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export default class View {
  static DefaultViewClass: typeof View = View;

  file: string;
  data: Record<string, any>;
  defaultFile: string;

  static factory(file: string, data: Record<string, any> = {}): View {
    return new this.DefaultViewClass(file, data);
  }

  constructor(file = "", data: Record<string, any> = {}, defaultFile = "") {
    this.file = file;
    this.data = data;
    this.defaultFile = defaultFile;
  }

  async render(): Promise<Record<string, any>> {
    return this.data;
  }
}

Object.freeze(View.prototype);
