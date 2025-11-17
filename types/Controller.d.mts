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
    static readonly STATE_CLIENT = "client";
    static readonly STATE_ACTION = "action";
    static readonly STATE_FULL_ACTION_NAME = "fullActionName";
    static readonly STATE_EXITED = "exited";
    static readonly STATE_BODY = "body";
    static readonly STATE_REQUEST = "request";
    static readonly STATE_REQUEST_BODY = "requestBody";
    static readonly STATE_REQUEST_HEADERS = "requestHeader";
    static readonly STATE_REQUEST_COOKIES = "requestCookie";
    static readonly STATE_HEADERS = "headers";
    static readonly STATE_COOKIES = "cookies";
    static readonly STATE_HOSTNAME = "hostname";
    static readonly STATE_QUERY = "query";
    static readonly STATE_STATUS = "status";
    static readonly STATE_PARAMS = "params";
    static readonly STATE_CLIENT_IP = "clientIP";
    static readonly STATE_USER_AGENT = "userAgent";
    static readonly STATE_CHECKPOINT = "checkpoint";
    static readonly STATE_LANGUAGE = "language";
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
