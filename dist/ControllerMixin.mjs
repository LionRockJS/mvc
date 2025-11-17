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
     */
    static init(state) { }
    /**
     * Setup is initializer for async functions, it runs in controller.execute() before state
     */
    static async setup(state) { }
    static async before(state) { }
    static async execute(fullActionName, state) {
        const action = this[fullActionName];
        if (!action)
            return;
        await action(state);
    }
    static async after(state) { }
    static async exit(state) { }
}
Object.freeze(ControllerMixin.prototype);
