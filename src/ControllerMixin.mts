/**
 * Copyright (c) 2023 Kojin Nakana
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export default class ControllerMixin {
  [key: string]: any;

  /**
   * init is static function during initialize controller,
   * should not directly modify controller's property because
   * it runs before concrete controller's constructor
   */
  static init(state: Map<string, any>): void {/***/}

  /**
   * Setup is initializer for async functions, it runs in controller.execute() before state
   */
  static async setup(state: Map<string, any>): Promise<void> {/***/}

  static async before(state: Map<string, any>): Promise<void> {/***/}

  static async execute(fullActionName: string, state: Map<string, any>): Promise<void> {
    const action = (this as any)[fullActionName];
    if (!action) return;
    await action(state);
  }

  static async after(state: Map<string, any>): Promise<void> {/***/}

  static async exit(state: Map<string, any>): Promise<void> {/***/}
}