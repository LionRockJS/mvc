/**
 * Copyright (c) 2023 Kojin Nakana
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export default class ControllerMixin {
  /**
   * init is static function during initialize controller,
   * should not directly modify controller's property because
   * it runs before concrete controller's constructor
   * @param {Map} state
   */
  static init(state) { }
  /**
   * Setup is initializer for async functions, it runs in controller.execute() before state
   * @param state
   * @returns {Promise<void>}
   */
  static async setup(state) { }
  /**
   *
   * @param {Map} state
   */
  static async before(state) { }
  /**
   * @param {String} fullActionName
   * @param {Map} state
   */
  static async execute(fullActionName, state) {
    if (!this[fullActionName])
      return;
    await this[fullActionName](state);
  }
  /**
   *
   * @param {Map} state
   */
  static async after(state) { }
  /**
   * @param {Map} state
   */
  static async exit(state) { }
}
Object.freeze(ControllerMixin.prototype);
