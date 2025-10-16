/**
 * @ignore
 */
const version = [2, 0, 0, "rc1"];

/**
 * @ignore
 */
const tagName = `bitty-${version[0]}-${version[1]}`;

/**
 * @ignore
 */
const blockStylesheet = new CSSStyleSheet();
blockStylesheet.replaceSync(
  `${tagName} { display: block; }`,
);
document.adoptedStyleSheets.push(blockStylesheet);

/**
 * @ignore
 */

function getUUID() {
  return self.crypto.randomUUID();
}

/**
 * @attribute {string} data-* - Arbitrary data to send
 * with the `data-send` event signals
 */

/**
 * @attribute {string} data-connect - Available only on the bitty-#-# tag
 *
 * Defines the module/class to use for the functionality
 * of the component.
 *
 * If there is no `data-connect` attribute the bitty
 * component attempts to use `window.BittyClass`.
 * If that's not available bitty throws an error.
 *
 * If `data-connect` exists and it's values matches
 * a class on the window object, then that class
 * gets used. For example:
 *
 * <bitty-#-# data-connect="ExampleClass"></bitty-#-#>
 *
 * uses
 *
 * window.ExampleClass
 *
 * if it's available or throws an error if it's not.
 *
 * If a class isn't found the value of `data-connect` is
 * treated as a path from which to load an external module.
 * For example,
 *
 * <bitty-#-# data-connect="/modules/example.js"></bitty-#-#>
 *
 * Attempts to load the module:
 *
 * `/modules/example.js` and use its default class defined
 * by:
 *
 * export default class {
 *
 * }
 *
 * TKTKTKTKT: Adding alternate class with
 * data-connect="/some/path.js|AltClass"
 */

/**
 * @attribute {string} data-listeners - Change the
 * event listeners the component uses. For example:
 *
 * data-listeners="mouseenter"
 *
 * Multiple listeners are separated by a pipe:
 *
 * data-listeners="mouseenter|mouseleave"
 *
 * The default listeners are 'click' and 'input'. Using
 * `data-listeners` overrides them complete. If
 * you need them along with the alternate listeners
 * they must be included.
 *
 * data-listeners="mouseenter|mouseleave|click|input"
 *
 * Turning off all listeners can be done by
 * passing an empty string
 *
 * data-listeners=""
 */

/**
 * @attribute {string} data-receive - Signals the
 * child element receive.
 *
 * data-receive="alfa"
 *
 * data-receive="bravo|charlie"
 */

/**
 * @attribute {string} data-send - Signals to send
 * when the component finishes initializing. Separate
 * multiple signals with pipes
 *
 * data-send="alfa"
 *
 * data-send="bravo|charlie"
 */

/**
 * @attribute {string} data-watch - Signals the
 * component should listen for from sibling
 * or parent elements.
 *
 * data-watch="alfa"
 *
 * data-watch="bravo|charlie"
 */

class BittyJs extends HTMLElement {
  constructor() {
    super();
    this.config = {
      listeners: ["click", "input"],
    };
    this.metadata = {
      copyright: "Copyright 2025 - Alan W. Smith",
      license:
        "License at: htttp://bitty.alanwsmith.com/ - 2y1pBoEREr3eWA1ubCCOXdmRCdn",
      version: version,
    };
  }

  /**
   * @ignore
   */

  async connectedCallback() {
    this.dataset.uuid = getUUID();
    this.receivers = [];
    this.setIds();
    this.url = new URL(window.location.href);
    await this.makeConnection();
    if (this.conn) {
      this.conn.api = this;
      this.handleEventBridge = this.handleEvent.bind(this);
      this.watchMutations = this.handleMutations.bind(this);
      this.loadReceivers();
      this.addObserver();
      this.addEventListeners();
      await this.callBittyInit();
      this.runSendFromComponent();
    }
  }

  /**
   * @internal
   */

  addEventListeners() {
    if (this.dataset.listeners) {
      this.config.listeners = this.dataset.listeners.split("|").map((l) =>
        l.trim()
      );
    }
    this.config.listeners.forEach((listener) => {
      document.addEventListener(listener, (event) => {
        if (
          event.target &&
          event.target.nodeName.toLowerCase() !== tagName &&
          event.target.dataset && event.target.dataset.send
        ) {
          event.uuid = getUUID();
          this.handleEventBridge.call(this, event);
        }
      });
    });
  }

  /**
   * @internal
   */

  addObserver() {
    this.observerConfig = { childList: true, subtree: true };
    this.observer = new MutationObserver(this.watchMutations);
    this.observer.observe(this, this.observerConfig);
  }

  /**
   * @internal
   */

  addReceiver(signal, el) {
    if (this.conn[signal]) {
      this.receivers.push({
        key: signal,
        f: (event) => {
          this.conn[signal](event, el);
        },
      });
    }
  }

  /**
   * @internal
   */

  async callBittyInit() {
    if (typeof this.conn.bittyInit === "function") {
      if (this.conn.bittyInit[Symbol.toStringTag] === "AsyncFunction") {
        await this.conn.bittyInit();
      } else {
        this.conn.bittyInit();
      }
    }
  }

  async fetchHTML(url, subs = [], options = {}) {
    const el = document.createElement("template");
    el.innerHTML = await this.fetchTxt(url, subs, options);
    return el.content.cloneNode(true);
  }

  async fetchJSON(url, subs = [], options = {}) {
    let content = await this.fetchTxt(url, subs, options);
    return JSON.parse(content);
  }

  async fetchLines(url, subs = [], options = {}) {
    const content = await this.fetchTxt(url, subs, options);
    return content.split("\n").map((line) => line.trim());
  }

  async fetchSVG(url, subs = [], options = {}) {
    const el = document.createElement("template");
    el.innerHTML = await this.fetchTxt(url, subs, options);
    return el.content.cloneNode(true);
  }

  async fetchTemplate(url, subs = [], options = {}) {
    return await this.fetchTxt(url, subs, options);
  }

  async fetchTxt(url, subs = [], options = {}) {
    let response = await fetch(url, options);
    try {
      if (!response.ok) {
        throw new Error(`${response.status} [${response.statusText}] - ${url}`);
      } else {
        let content = await response.text();
        subs.forEach((sub) => {
          content = content.replaceAll(sub[0], sub[1]);
        });
        return content;
      }
    } catch (error) {
      console.error(`fetchJson Error [${url}] - ${error}`);
      return undefined;
    }
  }

  // TODO: See about adding async/await here
  forward(event, signal) {
    if (!event || !event.target || !event.target.dataset) {
      event = {
        type: "bittyforward",
        target: { dataset: { forward: signal } },
      };
    }
    event.target.dataset.forward = signal;
    this.handleEvent(event);
  }

  /**
   * @internal
   */

  handleEvent(event) {
    let signals = null;
    if (event.target.dataset.forward) {
      signals = event.target.dataset.forward;
      delete event.target.dataset.forward;
    } else {
      signals = event.target.dataset.send;
    }
    this.processSignals(event, signals);
  }

  /**
   * @internal
   */

  handleMutations(mutationList, _observer) {
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        if (
          mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0
        ) {
          this.setIds();
          this.loadReceivers();
        }
      }
    }
  }

  async loadCSS(url, subs = [], options = {}) {
    const content = await this.fetchTxt(url, subs, options);
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(content);
    document.adoptedStyleSheets.push(sheet);
    return sheet;
  }

  /**
   * @internal
   */

  loadReceivers() {
    this.receivers = [];
    this.querySelectorAll(`[data-receive]`).forEach((el) => {
      el.dataset.receive.split("|").map((signal) => signal.trim()).forEach(
        (signal) => {
          this.addReceiver(signal, el);
        },
      );
    });
  }

  /**
   * @internal
   */

  async makeConnection() {
    try {
      if (!this.dataset.connect) {
        if (window.BittyClass) {
          this.conn = new window.BittyClass();
        } else {
          console.error(`${tagName} error: No class to connect to.`);
        }
      } else {
        const connParts = this.dataset.connect.split("|").map((x) => x.trim());
        if (
          typeof window[connParts[0]] !== "undefined"
        ) {
          this.conn = new window[connParts[0]]();
        } else {
          const mod = await import(connParts[0]);
          if (connParts[1] === undefined) {
            this.conn = new mod.default();
          } else {
            this.conn = new mod[connParts[1]]();
          }
        }
      }
    } catch (error) {
      console.error(`${tagName} error: ${error} - ${this.dataset.connect}`);
    }
  }

  match(event, el, key = "") {
    if (key === "") {
      key = "uuid";
    }
    if (
      event.target.dataset[key] === undefined || el.dataset[key] === undefined
    ) {
      return false;
    }
    return event.target.dataset[key] === el.dataset[key];
  }

  /**
   * @internal
   */

  processSignals(event, signals) {
    signals.split("|").map((signal) => signal.trim()).forEach((signal) => {
      let receiverCount = 0;
      this.receivers.forEach((receiver) => {
        if (receiver.key === signal) {
          receiverCount += 1;
          receiver.f(event);
        }
      });
      if (receiverCount === 0) {
        if (this.conn[signal]) {
          this.conn[signal](event, null);
        }
      }
    });
  }

  /**
   * @internal
   */

  runSendFromComponent() {
    if (this.dataset.send) {
      this.handleEvent(
        { type: "bittytagdatasend", uuid: getUUID(), target: this },
      );
    }
  }

  /**
   * @internal
   */

  setIds() {
    this.querySelectorAll("*").forEach((el) => {
      if (!el.dataset.uuid) {
        el.dataset.uuid = getUUID();
      }
    });
  }

  setProp(key, value) {
    document.documentElement.style.setProperty(key, value);
  }

  useTemplate(content, subs = []) {
    subs.forEach((sub) => {
      content = content.replaceAll(sub[0], sub[1]);
    });
    const el = document.createElement("template");
    el.innerHTML = content;
    return el.content.cloneNode(true);
  }
}

customElements.define(tagName, BittyJs);