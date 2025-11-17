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
  //controller states
  static readonly STATE_CLIENT = 'client' as const;
  static readonly STATE_ACTION = 'action' as const;
  static readonly STATE_FULL_ACTION_NAME = 'fullActionName' as const;
  static readonly STATE_EXITED = 'exited' as const;
  static readonly STATE_BODY = 'body' as const;

  //web controller states
  static readonly STATE_REQUEST = 'request' as const;
  static readonly STATE_REQUEST_BODY = 'requestBody' as const;
  static readonly STATE_REQUEST_HEADERS = 'requestHeader' as const;
  static readonly STATE_REQUEST_COOKIES = 'requestCookie' as const;
  static readonly STATE_HEADERS = 'headers' as const;
  static readonly STATE_COOKIES = 'cookies' as const;
  static readonly STATE_HOSTNAME = 'hostname' as const;
  static readonly STATE_QUERY = 'query' as const;
  static readonly STATE_STATUS = 'status' as const;

  //web application states
  static readonly STATE_PARAMS = 'params' as const;
  static readonly STATE_CLIENT_IP = 'clientIP' as const;
  static readonly STATE_USER_AGENT = 'userAgent' as const;
  static readonly STATE_CHECKPOINT = 'checkpoint' as const;
  static readonly STATE_LANGUAGE = 'language' as const;

  static mixins: typeof ControllerMixin[] = [];
  static suppressActionNotFound = false;

  // properties
  error: Error | null = null;
  state: Map<string, any> = new Map();
  [key: string]: any;

  constructor(request: Request, state: Map<string, any> = new Map()) {
    const query = request.query || {};
    const params = request.params || {};
    const raw = request.raw || {};

    this.state.set(Controller.STATE_CLIENT, this);
    this.state.set(Controller.STATE_ACTION, params.action);
    this.state.set(Controller.STATE_EXITED, false);
    this.state.set(Controller.STATE_BODY, '');

    this.state.set(Controller.STATE_REQUEST, request);
    this.state.set(Controller.STATE_REQUEST_BODY, request.body);
    this.state.set(Controller.STATE_REQUEST_HEADERS, request.headers);
    this.state.set(Controller.STATE_REQUEST_COOKIES, request.cookies);

    this.state.set(Controller.STATE_HEADERS, {});
    this.state.set(Controller.STATE_QUERY, query);
    const cookies: Cookie[] = [];
    const reqHeaders = request?.headers || {};
    this.state.set(Controller.STATE_COOKIES, cookies);
    this.state.set(Controller.STATE_STATUS, 200);

    this.state.set(Controller.STATE_PARAMS, params);

    this.state.set(Controller.STATE_LANGUAGE, params.language || query.language);
    this.state.set(Controller.STATE_CLIENT_IP, (!request?.headers) ? '0.0.0.0' : (
      reqHeaders['cf-connecting-ip']
      || reqHeaders['x-real-ip']
      || reqHeaders['x-real_ip']
      || reqHeaders['x-forwarded-for']
      || reqHeaders['remote_addr']
      || request.ip
      || '0.0.0.0'
    ));

    this.state.set(Controller.STATE_USER_AGENT, reqHeaders['user-agent'] || '');
    this.state.set(Controller.STATE_HOSTNAME, raw.hostname);
    this.state.set(Controller.STATE_CHECKPOINT, query.checkpoint || query.cp || null);

    state.forEach((value, key) => {
      this.state.set(key, value);
    });

    (this.constructor as typeof Controller).mixins.forEach(mixin => mixin.init(this.state));
  }

  async execute(actionName: string | null = null, retainState = false): Promise<ControllerResult> {
    try {
      // guard check function action_* exist
      const action = `action_${actionName || this.state.get(Controller.STATE_ACTION) || 'index'}`;
      this.state.set(Controller.STATE_FULL_ACTION_NAME, action);
      if (this[action] === undefined) await this.#handleActionNotFound(action);

      // stage 0 : setup
      if (!this.state.get(Controller.STATE_EXITED)) await this.#mixinsSetup();

      // stage 1 : before
      if (!this.state.get(Controller.STATE_EXITED)) await this.#mixinsBefore();
      if (!this.state.get(Controller.STATE_EXITED)) await this.before();

      // stage 2 : action
      if (!this.state.get(Controller.STATE_EXITED)) await this.mixinsAction(action);
      if (!this.state.get(Controller.STATE_EXITED)) await this[action]();

      // stage 3 : after
      if (!this.state.get(Controller.STATE_EXITED)) await this.#mixinsAfter();
      if (!this.state.get(Controller.STATE_EXITED)) await this.after();
    } catch (err) {
      await this.#serverError(err as Error);
    }

    const result: ControllerResult = {
      status: this.state.get(Controller.STATE_STATUS),
      body: this.state.get(Controller.STATE_BODY),
      headers: this.state.get(Controller.STATE_HEADERS),
      cookies: this.state.get(Controller.STATE_COOKIES),
    };

    //clear state to prevent memory leak
    if(!retainState) this.state.clear();
    return result;
  }

  async #handleActionNotFound(action: string): Promise<void> {
    if ((this.constructor as typeof Controller).suppressActionNotFound) {
      this[action] = async () => {/***/};
      return;
    }

    await this.#notFound(`${this.constructor.name}::${action} not found`);
  }

  async #loopMixins(lambda: (mixin: typeof ControllerMixin) => Promise<void>): Promise<void> {
    const { mixins } = this.constructor as typeof Controller;
    for (let i = 0; i < mixins.length; i++) {
      if (this.state.get(Controller.STATE_EXITED)) break;
      // eslint-disable-next-line no-await-in-loop
      await lambda(mixins[i]);
    }
  }

  async #mixinsSetup(): Promise<void> {
    await this.#loopMixins(async mixin => mixin.setup(this.state));
  }

  async #mixinsBefore(): Promise<void> {
    await this.#loopMixins(async mixin => mixin.before(this.state));
  }

  async before(): Promise<void> {/***/}

  async mixinsAction(fullActionName: string): Promise<void> {
    await this.#loopMixins(async mixin => mixin.execute(fullActionName, this.state));
  }

  async action_index(): Promise<void> {/***/}

  async #mixinsAfter(): Promise<void> {
    await this.#loopMixins(async mixin => mixin.after(this.state));
  }

  async after(): Promise<void> {/***/}

  async #notFound(msg: string): Promise<void> {
    this.state.set(Controller.STATE_BODY, `404 / ${msg}`);
    await this.exit(404);
  }

  async #serverError(err: Error): Promise<void> {
    this.error = err;
    const body = this.state.get(Controller.STATE_BODY);
    if (!body) this.state.set(Controller.STATE_BODY, err.message || '500 / Internal Server Error');
    await this.exit(500);
  }

  async redirect(location: string, keepQueryString = false): Promise<void> {
    const headers = this.state.get(Controller.STATE_HEADERS);
    if(!keepQueryString){
      headers.location = location;
    }else{
      const query = new URLSearchParams(this.state.get(Controller.STATE_QUERY));
      const qs = query.toString();
      const delimiter = /\?/.test(location) ? '&' : '?';
      headers.location = qs ? `${location}${delimiter}${qs}` : location;
    }
    this.state.set(Controller.STATE_HEADERS, headers);
    await this.exit(302);
  }

  async forbidden(msg = ''): Promise<void> {
    this.state.set(Controller.STATE_BODY, `403 / ${msg}`);
    await this.exit(403);
  }

  async exit(code: number): Promise<void> {
    this.state.set(Controller.STATE_STATUS, code);
    this.state.set(Controller.STATE_EXITED, true);

    //exit all mixins
    const { mixins } = this.constructor as typeof Controller;
    await Promise.all(mixins.map(async mixin => mixin.exit(this.state)));

    //run delegate onExit
    await this.onExit();
  }

  async onExit(): Promise<void> {}
}