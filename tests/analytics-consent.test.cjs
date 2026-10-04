const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = readFileSync(join(__dirname, "../assets/js/analytics-consent.js"), "utf8");
const measurementId = "G-TEST123456";
const disableKey = `ga-disable-${measurementId}`;
const storageKey = `dojo-analytics-consent-v1-${measurementId}`;

function createPage({
  saved = null,
  version = "1",
  privacyUrl = "",
  throwReads = false,
  throwWrites = false,
  throwStorageAccess = false,
  readyState = "complete",
} = {}) {
  const values = new Map(saved === null ? [] : [[storageKey, saved]]);
  const windowListeners = new Map();
  const documentListeners = new Map();
  const warnings = [];
  let reloads = 0;

  class Element {
    constructor(tagName) {
      this.tagName = tagName;
      this.children = [];
      this.dataset = {};
      this.listeners = new Map();
      this.hidden = false;
      this.classList = { add: (name) => { this.className = name; } };
    }
    appendChild(child) {
      this.children.push(child);
      return child;
    }
    append(...children) {
      this.children.push(...children);
    }
    setAttribute(name, value) {
      this[name] = value;
    }
    addEventListener(name, callback) {
      this.listeners.set(name, callback);
    }
    contains(element) {
      return element === this || this.children.some((child) => child.contains(element));
    }
    focus() {
      document.activeElement = this;
    }
    click() {
      this.focus();
      this.listeners.get("click")();
    }
  }

  const document = {
    readyState,
    activeElement: null,
    body: new Element("body"),
    head: new Element("head"),
    currentScript: new Element("script"),
    querySelector: () => footer,
    createElement: (tagName) => new Element(tagName),
    addEventListener: (name, callback) => documentListeners.set(name, callback),
  };
  const footer = new Element("footer");
  const footerRow = new Element("div");
  footer.querySelector = () => footerRow;
  footer.appendChild(footerRow);
  document.body.appendChild(footer);
  document.currentScript.dataset = {
    measurementId,
    consentVersion: version,
    privacyNoticeUrl: privacyUrl,
    privacyNoticeLabel: "Read our privacy notice",
    regionLabel: "Analytics consent options",
    bannerTitle: "Your privacy choices",
    bannerMessage: "Allow analytics?",
    acceptLabel: "Accept analytics cookies",
    rejectLabel: "Reject",
    settingsLabel: "Cookie preferences",
  };
  const window = {
    localStorage: {
      getItem(key) {
        if (throwReads) throw new Error("Storage is unavailable");
        return values.get(key) ?? null;
      },
      setItem(key, value) {
        if (throwWrites) throw new Error("Storage is unavailable");
        values.set(key, value);
      },
    },
    location: { reload: () => reloads++ },
    addEventListener: (name, callback) => windowListeners.set(name, callback),
  };
  if (throwStorageAccess) {
    Object.defineProperty(window, "localStorage", {
      get() { throw new Error("Access to storage is blocked"); },
    });
  }

  vm.runInNewContext(source, {
    window,
    document,
    console: {
      warn: (...args) => warnings.push(args),
      error: (...args) => warnings.push(args),
    },
  });

  const findByClass = (name, element = document.body) => {
    if (element.className === name) return element;
    for (const child of element.children) {
      const found = findByClass(name, child);
      if (found) return found;
    }
  };
  const banner = () => findByClass("analytics-consent");
  const settings = () => findByClass("analytics-consent-settings");
  const actions = () =>
    banner().children.find((element) => element.className === "analytics-consent__actions");
  return {
    window, document, footer, footerRow, values, warnings, banner, settings,
    accept: () => actions().children[0].click(),
    reject: () => actions().children[1].click(),
    openSettings: () => settings().click(),
    reloads: () => reloads,
    domReady: () => documentListeners.get("DOMContentLoaded")(),
    pageshow: () => windowListeners.get("pageshow")(),
    storage(value, key = storageKey, storageArea = window.localStorage) {
      if (key === null) values.clear();
      else if (value === null) values.delete(key);
      else values.set(key, value);
      windowListeners.get("storage")({ key, newValue: value, storageArea });
    },
  };
}

test("first visit shows an accessible prompt without loading Google", () => {
  const page = createPage();
  assert.equal(page.banner().hidden, false);
  assert.equal(page.banner().role, "region");
  assert.equal(page.banner()["aria-label"], "Analytics consent options");
  assert.equal(page.settings().hidden, true);
  assert.equal(page.document.head.children.length, 0);
  assert.equal(page.window[disableKey], true);
  assert.equal(page.window.dataLayer, undefined);
});

test("mounts once the document is ready", () => {
  const page = createPage({ readyState: "loading" });
  assert.equal(page.banner(), undefined);
  page.domReady();
  assert.equal(page.banner().hidden, false);
});

test("rejecting saves consent without any Google initialization", () => {
  const page = createPage();
  page.reject();
  assert.equal(page.values.get(storageKey), "rejected");
  assert.equal(page.banner().hidden, true);
  assert.equal(page.settings().hidden, false);
  assert.equal(page.document.activeElement, page.settings());
  assert.equal(page.document.head.children.length, 0);
  assert.equal(page.reloads(), 0);
});

test("saved rejection is respected", () => {
  const page = createPage({ saved: "rejected" });
  assert.equal(page.banner().hidden, true);
  assert.equal(page.settings().hidden, false);
  assert.equal(page.document.head.children.length, 0);
});

test("accepting loads exactly one asynchronous tag and one page view", () => {
  const page = createPage();
  page.accept();
  assert.equal(page.values.get(storageKey), "accepted");
  assert.equal(page.window[disableKey], false);
  assert.equal(page.document.head.children.length, 1);
  const tag = page.document.head.children[0];
  assert.equal(tag.async, true);
  assert.equal(tag.src, `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
  assert.equal(page.window.dataLayer[0][2].analytics_storage, "granted");
  assert.equal(page.window.dataLayer[0][2].ad_storage, "denied");
  assert.equal(page.window.dataLayer[0][2].ad_user_data, "denied");
  assert.equal(page.window.dataLayer[0][2].ad_personalization, "denied");
  assert.equal(page.window.dataLayer[2][2].send_page_view, false);
  assert.equal(page.window.dataLayer[2][2].allow_google_signals, false);
  assert.equal(page.window.dataLayer[3][1], "page_view");
  page.openSettings();
  page.accept();
  assert.equal(page.document.head.children.length, 1);
  assert.equal(page.window.dataLayer.length, 4);
});

test("settings can change saved rejection to acceptance", () => {
  const page = createPage({ saved: "rejected" });
  page.openSettings();
  assert.equal(page.banner().hidden, false);
  assert.equal(page.settings().hidden, true);
  assert.equal(page.document.activeElement.textContent, "Accept analytics cookies");
  page.accept();
  assert.equal(page.document.head.children.length, 1);
});

test("withdrawal disables collection before reloading without queuing cookieless pings", () => {
  const page = createPage({ saved: "accepted" });
  assert.equal(page.document.head.children.length, 1);
  page.openSettings();
  page.reject();
  assert.equal(page.values.get(storageKey), "rejected");
  assert.equal(page.window[disableKey], true);
  assert.equal(page.reloads(), 1);
  assert.equal(page.window.dataLayer.length, 4);
  const nextPage = createPage({ saved: page.values.get(storageKey) });
  assert.equal(nextPage.document.head.children.length, 0);
  nextPage.openSettings();
  nextPage.accept();
  assert.equal(nextPage.document.head.children.length, 1);
  assert.equal(nextPage.window[disableKey], false);
});

test("withdrawal while the tag is still downloading keeps the queued page view disabled", () => {
  const page = createPage();
  page.accept();
  page.openSettings();
  page.reject();
  assert.equal(page.window[disableKey], true);
  assert.equal(page.reloads(), 1);
});

test("withdrawal in another tab immediately disables this page and reloads only once", () => {
  const page = createPage({ saved: "accepted" });
  page.storage("rejected");
  assert.equal(page.window[disableKey], true);
  assert.equal(page.reloads(), 1);
  page.storage("rejected");
  assert.equal(page.reloads(), 1);
});

test("cross-tab acceptance loads the tag; unrelated storage changes are ignored", () => {
  const page = createPage();
  page.storage("accepted", "unrelated-key");
  assert.equal(page.document.head.children.length, 0);
  page.storage("accepted", storageKey, {});
  assert.equal(page.document.head.children.length, 0);
  page.storage("accepted");
  assert.equal(page.document.head.children.length, 1);
  assert.equal(page.banner().hidden, true);
});

for (const key of [storageKey, null]) {
  test(`clearing consent (${key === null ? "all storage" : "one key"}) revokes active tracking`, () => {
    const page = createPage({ saved: "accepted" });
    page.storage(null, key);
    assert.equal(page.window[disableKey], true);
    assert.equal(page.reloads(), 1);
    assert.equal(page.banner().hidden, false);
  });
}

test("clearing a saved rejection shows the prompt without loading a tag", () => {
  const page = createPage({ saved: "rejected" });
  page.storage(null);
  assert.equal(page.banner().hidden, false);
  assert.equal(page.document.head.children.length, 0);
  assert.equal(page.reloads(), 0);
});

test("back/forward cache restoration rechecks stored consent", () => {
  const page = createPage({ saved: "accepted" });
  page.values.set(storageKey, "rejected");
  page.pageshow();
  assert.equal(page.window[disableKey], true);
  assert.equal(page.reloads(), 1);
});

test("corrupt stored consent and a new consent version require a fresh choice", () => {
  for (const options of [{ saved: "invalid" }, { saved: "accepted", version: "2" }]) {
    const page = createPage(options);
    assert.equal(page.banner().hidden, false);
    assert.equal(page.document.head.children.length, 0);
  }
});

test("unavailable storage defaults to no consent and logs the limitation", () => {
  const page = createPage({ throwReads: true, throwWrites: true });
  assert.equal(page.document.head.children.length, 0);
  assert.equal(page.warnings.length, 1);
  page.accept();
  assert.equal(page.document.head.children.length, 1);
  assert.equal(page.warnings.length, 2);
});

test("blocked access to localStorage still requires explicit acceptance", () => {
  const page = createPage({ throwStorageAccess: true });
  assert.equal(page.document.head.children.length, 0);
  assert.equal(page.warnings.length, 1);
  page.accept();
  assert.equal(page.document.head.children.length, 1);
  assert.equal(page.warnings.length, 2);
});

test("failed persistence during withdrawal never reloads into the previous saved acceptance", () => {
  const page = createPage({ saved: "accepted", throwWrites: true });
  page.openSettings();
  page.reject();
  assert.equal(page.window[disableKey], true);
  assert.equal(page.values.get(storageKey), "accepted");
  assert.equal(page.reloads(), 0);
  assert.equal(page.warnings.length, 1);
  page.pageshow();
  assert.equal(page.window[disableKey], true);
  assert.equal(page.reloads(), 0);
  page.openSettings();
  page.accept();
  assert.equal(page.window[disableKey], false);
  assert.equal(page.document.head.children.length, 1);
});

test("an optional privacy notice link uses the localized label", () => {
  const page = createPage({ privacyUrl: "/pt/privacidade/" });
  const link = page.banner().children
    .flatMap((element) => element.children)
    .find((element) => element.tagName === "a");
  assert.equal(link.href, "/pt/privacidade/");
  assert.equal(link.textContent, "Read our privacy notice");
});

test("tag load failures are reported", () => {
  const page = createPage();
  page.accept();
  page.document.head.children[0].onerror();
  assert.equal(page.warnings.length, 1);
  assert.match(page.warnings[0][0], /Failed to load/);
});

test("after either choice the banner closes and only footer preferences remain", () => {
  for (const choice of ["accept", "reject"]) {
    const page = createPage();
    page[choice]();
    assert.equal(page.banner().hidden, true);
    assert.equal(page.settings().hidden, false);
    assert.equal(page.footer.contains(page.settings()), true);
    assert.equal(page.footerRow.contains(page.settings()), true);
    assert.equal(page.footerRow.className, "analytics-consent-footer-row");
    assert.equal(page.settings().textContent, "Cookie preferences");
    assert.equal(page.settings().type, "button");
    page.openSettings();
    assert.equal(page.banner().hidden, false);
    assert.equal(page.document.activeElement.textContent, "Accept analytics cookies");
  }
});
