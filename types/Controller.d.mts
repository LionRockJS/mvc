/**
 * Copyright (c) 2024 Kojin Nakana
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type ControllerMixin from './ControllerMixin.mjs';
export interface Request {
    query?: Record<string, any>;
    params?: Record<string, any>;
    raw?: {
        hostname?: string;
    };
    body?: any;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    ip?: string;
}
export interface ControllerResult {
    status: number;
    body: string;
    headers: Record<string, string>;
    cookies: Array<{
        name: string;
        value: string;
        options: {
            secure?: boolean;
            maxAge?: number;
            [key: string]: any;
        };
    }>;
}
export default class Controller {
    #private;
    static STATE_CLIENT: string;
    static STATE_ACTION: string;
    static STATE_FULL_ACTION_NAME: string;
    static STATE_EXITED: string;
    static STATE_BODY: string;
    static STATE_REQUEST: string;
    static STATE_REQUEST_BODY: string;
    static STATE_REQUEST_HEADERS: string;
    static STATE_REQUEST_COOKIES: string;
    static STATE_HEADERS: string;
    static STATE_COOKIES: string;
    static STATE_HOSTNAME: string;
    static STATE_QUERY: string;
    static STATE_STATUS: string;
    static STATE_PARAMS: string;
    static STATE_CLIENT_IP: string;
    static STATE_USER_AGENT: string;
    static STATE_CHECKPOINT: string;
    static STATE_LANGUAGE: string;
    /**
     *
     * @type {ControllerMixin[]}
     */
    static mixins: typeof ControllerMixin[];
    static suppressActionNotFound: boolean;
    error: Error | null;
    state: Map<string, any>;
    /**
     *
     * @param {Request} request
     * @param {Map} state
     */
    constructor(request: Request, state?: Map<string, any>);
    /**
     *
     * @param {string | null} actionName
     * @param {boolean} retainState
     * @returns {object}
     */
    execute(actionName?: string | null, retainState?: boolean): Promise<ControllerResult>;
    before(): Promise<void>;
    mixinsAction(fullActionName: string): Promise<void>;
    action_index(): Promise<void>;
    after(): Promise<void>;
    /**
     *
     * @param {string} location
     * @param {boolean} keepQueryString
     */
    redirect(location: string, keepQueryString?: boolean): Promise<void>;
    /**
     *
     * @param {string} msg
     */
    forbidden(msg?: string): Promise<void>;
    /**
     *
     * @param {Number} code
     */
    exit(code: number): Promise<void>;
    onExit(): Promise<void>;
}
