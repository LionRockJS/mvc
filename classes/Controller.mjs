/**
 * Copyright (c) 2023 Kojin Nakana
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export default class Controller {
  /**
   *
   * @type {ControllerMixin[]}
   */
  static mixins = [];
  static suppressActionNotFound = false;

  #headerSent = false;

  // properties
  request = null;

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
   */
  constructor(request) {
    this.request = request;
    this.language = request.params?.language || request.query?.language;
    this.clientIP = (!this.request?.headers) ? '0.0.0.0' : (
      this.request.headers['cf-connecting-ip']
      || this.request.headers['x-real-ip']
      || this.request.headers['x-forwarded-for']
      || this.request.headers.remote_addr
      || this.request.ip
    );
    this.state.set('client', this);

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
      const action = `action_${actionName || this.request.params?.action || 'index'}`;
      this.state.set('full_action_name', action);
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
      const query = new URLSearchParams(this.request.query);
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
    await this.#mixinsExit();
    await this.onExit();
  }

  async #mixinsExit() {
    const { mixins } = this.constructor;
    await Promise.all(mixins.map(async mixin => mixin.exit(this.state)));
  }

  async onExit(){}
}

Object.freeze(Controller.prototype);