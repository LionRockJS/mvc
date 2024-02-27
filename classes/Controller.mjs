/**
 * Copyright (c) 2024 Kojin Nakana
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export default class Controller {
  static STATE_CLIENT = 'client';
  static STATE_REQUEST = 'request';
  static STATE_LANGUAGE = 'language';
  static STATE_CLIENT_IP = 'clientIP';
  static STATE_HOSTNAME = 'hostname';
  static STATE_CHECKPOINT = 'checkpoint';
  static STATE_ACTION = 'action';
  static STATE_QUERY = 'query';
  static STATE_PARAMS = 'params';
  static STATE_FULL_ACTION_NAME = 'full_action_name';
  static STATE_HEADERS = 'headers';

  /**
   *
   * @type {ControllerMixin[]}
   */
  static mixins = [];
  static suppressActionNotFound = false;

  #headerSent = false;

  // properties
  error = null;

  body = '';

  headers = {
    "X-Content-Type-Options": "nosniff"
  };

  /**
   *
   * @type {{name: String, value: String, options: {secure:Boolean, maxAge:Number}}[]} cookies
   */
  cookies = [];

  status = 200;

  state = new Map();

  /**
   *
   * @param {Request} request
   * @param {Map} state
   */
  constructor(request, state = new Map()) {
    const query = request.query || {};
    const params = request.params || {};
    const raw = request.raw || {};

    this.state.set(Controller.STATE_QUERY, query);
    this.state.set(Controller.STATE_PARAMS, params);
    this.state.set(Controller.STATE_CLIENT, this);
    this.state.set(Controller.STATE_REQUEST, request);
    this.state.set(Controller.STATE_LANGUAGE, params.language || query.language);
    this.state.set(Controller.STATE_CLIENT_IP, (!request?.headers) ? '0.0.0.0' : (
      request.headers['cf-connecting-ip']
      || request.headers['x-real-ip']
      || request.headers['x-forwarded-for']
      || request.headers.remote_addr
      || request.ip
    ));
    this.state.set(Controller.STATE_HOSTNAME, raw.hostname);
    this.state.set(Controller.STATE_CHECKPOINT, query.checkpoint || query.cp || null);
    this.state.set(Controller.STATE_ACTION, params.action);
    this.state.set(Controller.STATE_HEADERS, this.headers);

    state.forEach((value, key) => {
      this.state.set(key, value);
    });

    this.constructor.mixins.forEach(mixin => mixin.init(this.state));
  }

  /**
   *
   * @param {string | null} actionName
   * @returns {object}
   */
  async execute(actionName = null) {
    try {
      // guard check function action_* exist
      const action = `action_${actionName || this.state.get(Controller.STATE_ACTION) || 'index'}`;
      this.state.set(Controller.STATE_FULL_ACTION_NAME, action);
      if (this[action] === undefined) await this.#handleActionNotFound(action);

      // stage 0 : setup
      if (!this.#headerSent) await this.#mixinsSetup();

      // stage 1 : before
      if (!this.#headerSent) await this.#mixinsBefore();
      if (!this.#headerSent) await this.before();

      // stage 2 : action
      if (!this.#headerSent) await this.mixinsAction(action);
      if (!this.#headerSent) await this[action]();

      // stage 3 : after
      if (!this.#headerSent) await this.#mixinsAfter();
      if (!this.#headerSent) await this.after();
    } catch (err) {
      await this.#serverError(err);
    }

    return {
      status: this.status,
      body: this.body,
      headers: this.headers,
      cookies: this.cookies,
    };
  }

  async #handleActionNotFound(action) {
    if (this.constructor.suppressActionNotFound) {
      this[action] = async () => {/***/};
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
  async #loopMixins(lambda) {
    const { mixins } = this.constructor;
    for (let i = 0; i < mixins.length; i++) {
      if (this.#headerSent) break;
      // eslint-disable-next-line no-await-in-loop
      await lambda(mixins[i]);
    }
  }

  async #mixinsSetup() {
    await this.#loopMixins(async mixin => mixin.setup(this.state));
  }

  async #mixinsBefore() {
    await this.#loopMixins(async mixin => mixin.before(this.state));
  }

  async before() {/***/}

  async mixinsAction(fullActionName) {
    await this.#loopMixins(async mixin => mixin.execute(fullActionName, this.state));
  }

  async action_index() {/***/}

  async #mixinsAfter() {
    await this.#loopMixins(async mixin => mixin.after(this.state));
  }

  async after() {/***/}

  /**
   *
   * @param {string} msg
   */
  async #notFound(msg) {
    this.body = `404 / ${msg}`;
    await this.exit(404);
  }

  /**
   *
   * @param {Error} err
   */
  async #serverError(err) {
    this.error = err;
    if (!this.body) this.body = err.message;
    await this.exit(500);
  }

  /**
   *
   * @param {string} location
   * @param {boolean} keepQueryString
   */
  async redirect(location, keepQueryString= false) {
    if(!keepQueryString){
      this.headers.location = location;
    }else{
      const query = new URLSearchParams(this.state.get(Controller.STATE_QUERY));
      const qs = query.toString();
      const delimiter = /\?/.test(location) ? '&' : '?';
      this.headers.location = qs ? `${location}${delimiter}${qs}` : location;
    }
    await this.exit(302);
  }

  /**
   *
   * @param {string} msg
   */
  async forbidden(msg = '') {
    this.body = `403 / ${msg}`;
    await this.exit(403);
  }

  /**
   *
   * @param {Number} code
   */
  async exit(code) {
    this.status = code;
    this.#headerSent = true;

    //exit all mixins
    const { mixins } = this.constructor;
    await Promise.all(mixins.map(async mixin => mixin.exit(this.state)));

    //run delegate onExit
    await this.onExit();
  }

  async onExit(){}
}

Object.freeze(Controller.prototype);