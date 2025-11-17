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
    static init(state: Map<string, any>): void;
    /**
     * Setup is initializer for async functions, it runs in controller.execute() before state
     */
    static setup(state: Map<string, any>): Promise<void>;
    static before(state: Map<string, any>): Promise<void>;
    static execute(fullActionName: string, state: Map<string, any>): Promise<void>;
    static after(state: Map<string, any>): Promise<void>;
    static exit(state: Map<string, any>): Promise<void>;
}
