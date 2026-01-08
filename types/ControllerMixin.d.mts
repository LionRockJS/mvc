/**
 * Copyright (c) 2023 Kojin Nakana
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export default abstract class ControllerMixin {
    /**
     * init is static function during initialize controller,
     * should not directly modify controller's property because
     * it runs before concrete controller's constructor
     * @param {Map} state
     */
    static init(state: Map<string, any>): void;
    /**
     * Setup is initializer for async functions, it runs in controller.execute() before state
     * @param state
     * @returns {Promise<void>}
     */
    static setup(state: Map<string, any>): Promise<void>;
    /**
     *
     * @param {Map} state
     */
    static before(state: Map<string, any>): Promise<void>;
    /**
     * @param {String} fullActionName
     * @param {Map} state
     */
    static execute(fullActionName: string, state: Map<string, any>): Promise<void>;
    /**
     *
     * @param {Map} state
     */
    static after(state: Map<string, any>): Promise<void>;
    /**
     * @param {Map} state
     */
    static exit(state: Map<string, any>): Promise<void>;
}
