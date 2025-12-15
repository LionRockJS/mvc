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

export enum ControllerState {
  CLIENT = 'client',
  ACTION = 'action',
  FULL_ACTION_NAME = 'fullActionName',
  EXITED = 'exited',
  BODY = 'body',
  REQUEST = 'request',
  REQUEST_BODY = 'requestBody',
  REQUEST_HEADERS = 'requestHeader',
  REQUEST_COOKIES = 'requestCookie',
  HEADERS = 'headers',
  COOKIES = 'cookies',
  HOSTNAME = 'hostname',
  QUERY = 'query',
  STATUS = 'status',
  PARAMS = 'params',
  CLIENT_IP = 'clientIP',
  USER_AGENT = 'userAgent',
  CHECKPOINT = 'checkpoint',
  LANGUAGE = 'language',
}

export default class Controller {
  //controller states
  //web controller states
  //web application states

  /**
   *
   * @type {ControllerMixin[]}
   */
  static mixins: typeof ControllerMixin[] = [];
  static suppressActionNotFound = false;

  // properties
  error: Error | null = null;
  state = new Map<any, any>();
  version = '2.0.0';

  /**
   *
   * @param {Request} request
   * @param {Map} state
   */
  constructor(request: Request, state = new Map<any, any>()) {
    const query = request.query || {};
    const params = request.params || {};
    const raw = request.raw || {};

    this.state.set(ControllerState.CLIENT, this);
    this.state.set(ControllerState.ACTION, params.action);
    this.state.set(ControllerState.EXITED, false);
    this.state.set(ControllerState.BODY, '');

    this.state.set(ControllerState.REQUEST, request);
    this.state.set(ControllerState.REQUEST_BODY, request.body);
    this.state.set(ControllerState.REQUEST_HEADERS, request.headers);
    this.state.set(ControllerState.REQUEST_COOKIES, request.cookies);

    this.state.set(ControllerState.HEADERS, {});
    this.state.set(ControllerState.QUERY, query);
    /**
     * cookie to set
     * @type {{name: String, value: String, options: {secure:Boolean, maxAge:Number}}[]} cookies
     */
    const cookies: Array<{
      name: string;
      value: string;
      options: {
        secure?: boolean;
        maxAge?: number;
        [key: string]: any;
      };
    }> = [];
    const reqHeaders = request?.headers || {};
    this.state.set(ControllerState.COOKIES, cookies);
    this.state.set(ControllerState.STATUS, 200);

    this.state.set(ControllerState.PARAMS, params);

    this.state.set(ControllerState.LANGUAGE, params.language || query.language);
    this.state.set(ControllerState.CLIENT_IP, (!request?.headers) ? '0.0.0.0' : (
      reqHeaders['cf-connecting-ip']
      || reqHeaders['x-real-ip']
      || reqHeaders['x-real_ip']
      || reqHeaders['x-forwarded-for']
      || reqHeaders['remote_addr']
      || request.ip
      || '0.0.0.0'
    ));

    this.state.set(ControllerState.USER_AGENT, reqHeaders['user-agent'] || '');
    this.state.set(ControllerState.HOSTNAME, raw.hostname);
    this.state.set(ControllerState.CHECKPOINT, query.checkpoint || query.cp || null);

    state.forEach((value, key) => {
      this.state.set(key, value);
    });

    (this.constructor as typeof Controller).mixins.forEach(mixin => mixin.init(this.state));
  }

  /**
   *
   * @param {string | null} actionName
   * @param {boolean} retainState
   * @returns {object}
   */
  async execute(actionName: string | null = null, retainState = false): Promise<ControllerResult> {
    try {
      // guard check function action_* exist
      const action = `action_${actionName || this.state.get(ControllerState.ACTION) || 'index'}`;
      this.state.set(ControllerState.FULL_ACTION_NAME, action);
      if ((this as any)[action] === undefined) await this.#handleActionNotFound(action);

      // stage 0 : setup
      if (!this.state.get(ControllerState.EXITED)) await this.#mixinsSetup();

      // stage 1 : before
      if (!this.state.get(ControllerState.EXITED)) await this.#mixinsBefore();
      if (!this.state.get(ControllerState.EXITED)) await this.before();

      // stage 2 : action
      if (!this.state.get(ControllerState.EXITED)) await this.mixinsAction(action);
      if (!this.state.get(ControllerState.EXITED)) await (this as any)[action]();

      // stage 3 : after
      if (!this.state.get(ControllerState.EXITED)) await this.#mixinsAfter();
      if (!this.state.get(ControllerState.EXITED)) await this.after();
    } catch (err) {
      await this.#serverError(err as Error);
    }

    const result: ControllerResult = {
      status: this.state.get(ControllerState.STATUS),
      body: this.state.get(ControllerState.BODY),
      headers: this.state.get(ControllerState.HEADERS),
      cookies: this.state.get(ControllerState.COOKIES),
    };

    //clear state to prevent memory leak
    if(!retainState) this.state.clear();
    return result;
  }

  async #handleActionNotFound(action: string): Promise<void> {
    if ((this.constructor as typeof Controller).suppressActionNotFound) {
      (this as any)[action] = async () => {/***/};
      return;
    }

    await this.#notFound(`${this.constructor.name}::${action} not found`);
  }

  /**
   * @async
   * @callback MixinCallback
   * @param {ControllerMixin} mixin
   */
  /**
   *
   * @param {MixinCallback} lambda
   * @returns {Promise<void>}
   */
  async #loopMixins(lambda: (mixin: typeof ControllerMixin) => Promise<void>): Promise<void> {
    const { mixins } = this.constructor as typeof Controller;
    for (let i = 0; i < mixins.length; i++) {
      if (this.state.get(ControllerState.EXITED)) break;
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

  /**
   *
   * @param {string} msg
   */
  async #notFound(msg: string): Promise<void> {
    this.state.set(ControllerState.BODY, `404 / ${msg}`);
    await this.exit(404);
  }

  /**
   *
   * @param {Error} err
   */
  async #serverError(err: Error): Promise<void> {
    this.error = err;
    const body = this.state.get(ControllerState.BODY);
    if (!body) this.state.set(ControllerState.BODY, err.message || '500 / Internal Server Error');
    await this.exit(500);
  }

  /**
   *
   * @param {string} location
   * @param {boolean} keepQueryString
   */
  async redirect(location: string, keepQueryString = false): Promise<void> {
    const headers = this.state.get(ControllerState.HEADERS);
    if(!keepQueryString){
      headers.location = location;
    }else{
      const query = new URLSearchParams(this.state.get(ControllerState.QUERY));
      const qs = query.toString();
      const delimiter = /\?/.test(location) ? '&' : '?';
      headers.location = qs ? `${location}${delimiter}${qs}` : location;
    }
    this.state.set(ControllerState.HEADERS, headers);
    await this.exit(302);
  }

  /**
   *
   * @param {string} msg
   */
  async forbidden(msg = ''): Promise<void> {
    this.state.set(ControllerState.BODY, `403 / ${msg}`);
    await this.exit(403);
  }

  /**
   *
   * @param {Number} code
   */
  async exit(code: number): Promise<void> {
    this.state.set(ControllerState.STATUS, code);
    this.state.set(ControllerState.EXITED, true);

    //exit all mixins
    const { mixins } = this.constructor as typeof Controller;
    await Promise.all(mixins.map(async mixin => mixin.exit(this.state)));

    //run delegate onExit
    await this.onExit();
  }

  async onExit(): Promise<void> {}
}

Object.freeze(Controller.prototype);
