/**
 * Copyright (c) 2024 Kojin Nakana
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export var ControllerState;
(function (ControllerState) {
    ControllerState["CLIENT"] = "client";
    ControllerState["ACTION"] = "action";
    ControllerState["FULL_ACTION_NAME"] = "fullActionName";
    ControllerState["EXITED"] = "exited";
    ControllerState["BODY"] = "body";
    ControllerState["REQUEST"] = "request";
    ControllerState["REQUEST_BODY"] = "requestBody";
    ControllerState["REQUEST_HEADERS"] = "requestHeader";
    ControllerState["REQUEST_COOKIES"] = "requestCookie";
    ControllerState["HEADERS"] = "headers";
    ControllerState["COOKIES"] = "cookies";
    ControllerState["HOSTNAME"] = "hostname";
    ControllerState["QUERY"] = "query";
    ControllerState["STATUS"] = "status";
    ControllerState["PARAMS"] = "params";
    ControllerState["CLIENT_IP"] = "clientIP";
    ControllerState["USER_AGENT"] = "userAgent";
    ControllerState["CHECKPOINT"] = "checkpoint";
    ControllerState["LANGUAGE"] = "language";
})(ControllerState || (ControllerState = {}));
export default class Controller {
    //controller states
    //web controller states
    //web application states
    /**
     *
     * @type {ControllerMixin[]}
     */
    static mixins = [];
    static suppressActionNotFound = false;
    // properties
    error = null;
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
        const cookies = [];
        const reqHeaders = request?.headers || {};
        this.state.set(ControllerState.COOKIES, cookies);
        this.state.set(ControllerState.STATUS, 200);
        this.state.set(ControllerState.PARAMS, params);
        this.state.set(ControllerState.LANGUAGE, params.language || query.language);
        this.state.set(ControllerState.CLIENT_IP, (!request?.headers) ? '0.0.0.0' : (reqHeaders['cf-connecting-ip']
            || reqHeaders['x-real-ip']
            || reqHeaders['x-real_ip']
            || reqHeaders['x-forwarded-for']
            || reqHeaders['remote_addr']
            || request.ip
            || '0.0.0.0'));
        this.state.set(ControllerState.USER_AGENT, reqHeaders['user-agent'] || '');
        this.state.set(ControllerState.HOSTNAME, raw.hostname);
        this.state.set(ControllerState.CHECKPOINT, query.checkpoint || query.cp || null);
        state.forEach((value, key) => {
            this.state.set(key, value);
        });
        this.constructor.mixins.forEach(mixin => mixin.init(this.state));
    }
    /**
     *
     * @param {string | null} actionName
     * @param {boolean} retainState
     * @returns {object}
     */
    async execute(actionName = null, retainState = false) {
        try {
            // guard check function action_* exist
            const action = `action_${actionName || this.state.get(ControllerState.ACTION) || 'index'}`;
            this.state.set(ControllerState.FULL_ACTION_NAME, action);
            if (this[action] === undefined)
                await this.#handleActionNotFound(action);
            // stage 0 : setup
            if (!this.state.get(ControllerState.EXITED))
                await this.#mixinsSetup();
            // stage 1 : before
            if (!this.state.get(ControllerState.EXITED))
                await this.#mixinsBefore();
            if (!this.state.get(ControllerState.EXITED))
                await this.before();
            // stage 2 : action
            if (!this.state.get(ControllerState.EXITED))
                await this.mixinsAction(action);
            if (!this.state.get(ControllerState.EXITED))
                await this[action]();
            // stage 3 : after
            if (!this.state.get(ControllerState.EXITED))
                await this.#mixinsAfter();
            if (!this.state.get(ControllerState.EXITED))
                await this.after();
        }
        catch (err) {
            await this.#serverError(err);
        }
        const result = {
            status: this.state.get(ControllerState.STATUS),
            body: this.state.get(ControllerState.BODY),
            headers: this.state.get(ControllerState.HEADERS),
            cookies: this.state.get(ControllerState.COOKIES),
        };
        //clear state to prevent memory leak
        if (!retainState)
            this.state.clear();
        return result;
    }
    async #handleActionNotFound(action) {
        if (this.constructor.suppressActionNotFound) {
            this[action] = async () => { };
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
            if (this.state.get(ControllerState.EXITED))
                break;
            // eslint-disable-next-line no-await-in-loop
            await lambda(mixins[i]);
        }
    }
    async #mixinsSetup() {
        await this.#loopMixins(async (mixin) => mixin.setup(this.state));
    }
    async #mixinsBefore() {
        await this.#loopMixins(async (mixin) => mixin.before(this.state));
    }
    async before() { }
    async mixinsAction(fullActionName) {
        await this.#loopMixins(async (mixin) => mixin.execute(fullActionName, this.state));
    }
    async action_index() { }
    async #mixinsAfter() {
        await this.#loopMixins(async (mixin) => mixin.after(this.state));
    }
    async after() { }
    /**
     *
     * @param {string} msg
     */
    async #notFound(msg) {
        this.state.set(ControllerState.BODY, `404 / ${msg}`);
        await this.exit(404);
    }
    /**
     *
     * @param {Error} err
     */
    async #serverError(err) {
        this.error = err;
        const body = this.state.get(ControllerState.BODY);
        if (!body)
            this.state.set(ControllerState.BODY, err.message || '500 / Internal Server Error');
        await this.exit(500);
    }
    /**
     *
     * @param {string} location
     * @param {boolean} keepQueryString
     */
    async redirect(location, keepQueryString = false) {
        const headers = this.state.get(ControllerState.HEADERS);
        if (!keepQueryString) {
            headers.location = location;
        }
        else {
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
    async forbidden(msg = '') {
        this.state.set(ControllerState.BODY, `403 / ${msg}`);
        await this.exit(403);
    }
    /**
     *
     * @param {Number} code
     */
    async exit(code) {
        this.state.set(ControllerState.STATUS, code);
        this.state.set(ControllerState.EXITED, true);
        //exit all mixins
        const { mixins } = this.constructor;
        await Promise.all(mixins.map(async (mixin) => mixin.exit(this.state)));
        //run delegate onExit
        await this.onExit();
    }
    async onExit() { }
}
Object.freeze(Controller.prototype);
