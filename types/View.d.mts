/**
 * Copyright (c) 2022 Kojin Nakana
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export default class View {
    static DefaultViewClass: typeof View;
    file: string;
    data: Record<string, any>;
    defaultFile: string;
    static factory(file: string, data?: Record<string, any>): View;
    constructor(file?: string, data?: Record<string, any>, defaultFile?: string);
    render(): Promise<Record<string, any>>;
}
