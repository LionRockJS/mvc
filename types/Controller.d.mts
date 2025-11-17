/**
 * Copyright (c) 2024 Kojin Nakana
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import ControllerMixin from './ControllerMixin.mjs';
export interface RequestHeaders {
    [key: string]: string | string[] | undefined;
    'cf-connecting-ip'?: string;
    'x-real-ip'?: string;
    'x-real_ip'?: string;
    'x-forwarded-for'?: string;
    'remote_addr'?: string;
    'user-agent'?: string;
}
export interface RequestQuery {
    [key: string]: any;
    language?: string;
    checkpoint?: string;
    cp?: string;
}
export interface RequestParams {
    [key: string]: any;
    action?: string;
    language?: string;
}
export interface RequestRaw {
    hostname?: string;
    [key: string]: any;
}
export interface Request {
    query?: RequestQuery;
    params?: RequestParams;
    raw?: RequestRaw;
    body?: any;
    headers?: RequestHeaders;
    cookies?: any;
    ip?: string;
}
export interface CookieOptions {
    secure?: boolean;
    maxAge?: number;
    [key: string]: any;
}
export interface Cookie {
    name: string;
    value: string;
    options?: CookieOptions;
}
export interface ControllerResult {
    status: number;
    body: string;
    headers: Record<string, any>;
    cookies: Cookie[];
}
export default class Controller {
    #private;
    static readonly STATE_CLIENT: "client";
    static readonly STATE_ACTION: "action";
    static readonly STATE_FULL_ACTION_NAME: "fullActionName";
    static readonly STATE_EXITED: "exited";
    static readonly STATE_BODY: "body";
    static readonly STATE_REQUEST: "request";
    static readonly STATE_REQUEST_BODY: "requestBody";
    static readonly STATE_REQUEST_HEADERS: "requestHeader";
    static readonly STATE_REQUEST_COOKIES: "requestCookie";
    static readonly STATE_HEADERS: "headers";
    static readonly STATE_COOKIES: "cookies";
    static readonly STATE_HOSTNAME: "hostname";
    static readonly STATE_QUERY: "query";
    static readonly STATE_STATUS: "status";
    static readonly STATE_PARAMS: "params";
    static readonly STATE_CLIENT_IP: "clientIP";
    static readonly STATE_USER_AGENT: "userAgent";
    static readonly STATE_CHECKPOINT: "checkpoint";
    static readonly STATE_LANGUAGE: "language";
    static mixins: typeof ControllerMixin[];
    static suppressActionNotFound: boolean;
    error: Error | null;
    state: Map<string, any>;
    [key: string]: any;
    constructor(request: Request, state?: Map<string, any>);
    execute(actionName?: string | null, retainState?: boolean): Promise<ControllerResult>;
    before(): Promise<void>;
    mixinsAction(fullActionName: string): Promise<void>;
    action_index(): Promise<void>;
    after(): Promise<void>;
    redirect(location: string, keepQueryString?: boolean): Promise<void>;
    forbidden(msg?: string): Promise<void>;
    exit(code: number): Promise<void>;
    onExit(): Promise<void>;
}
