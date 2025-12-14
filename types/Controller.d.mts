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
export declare enum ControllerState {
    CLIENT = "client",
    ACTION = "action",
    FULL_ACTION_NAME = "fullActionName",
    EXITED = "exited",
    BODY = "body",
    REQUEST = "request",
    REQUEST_BODY = "requestBody",
    REQUEST_HEADERS = "requestHeader",
    REQUEST_COOKIES = "requestCookie",
    HEADERS = "headers",
    COOKIES = "cookies",
    HOSTNAME = "hostname",
    QUERY = "query",
    STATUS = "status",
    PARAMS = "params",
    CLIENT_IP = "clientIP",
    USER_AGENT = "userAgent",
    CHECKPOINT = "checkpoint",
    LANGUAGE = "language"
}
export default class Controller {
    #private;
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
