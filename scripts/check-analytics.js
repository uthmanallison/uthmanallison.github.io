const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const appended = [];
const listeners = {};
const banner = { hidden: true };
const status = { textContent: "" };
const values = new Map();
let reloads = 0;

const context = {
  Date,
  Set,
  localStorage: {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  },
  document: {
    querySelector: (selector) => selector === "[data-consent-banner]" ? banner : selector === "[data-consent-status]" ? status : null,
    addEventListener: (name, handler) => { listeners[name] = handler; },
    createElement: () => ({}),
    head: { append: (element) => appended.push(element) }
  },
  window: { dataLayer: [], location: { reload: () => { reloads += 1; } } }
};

vm.runInNewContext(fs.readFileSync("js/analytics.js", "utf8"), context);
assert.equal(appended.length, 0, "analytics must not load before consent");
assert.equal(banner.hidden, false, "unset consent must show the choice");

click({ consent: "declined" });
assert.equal(appended.length, 0, "declining must not load analytics");
assert.equal(banner.hidden, true);

click({ consent: "accepted" });
assert.equal(appended.length, 1, "accepting should append one analytics script");
assert.match(appended[0].src, /G-VWG0C7WTQ4$/);
appended[0].onload();

click({ analyticsEvent: "project_open", analyticsLabel: "test_project" });
assert.ok(context.window.dataLayer.some((args) => args[0] === "event" && args[1] === "project_open"));

const before = context.window.dataLayer.length;
click({ analyticsEvent: "unknown_event", analyticsLabel: "ignored" });
assert.equal(context.window.dataLayer.length, before, "unknown events must be ignored");

click({ reset: true });
assert.equal(reloads, 1, "withdrawing consent after load should reload without analytics");

console.log("Analytics checks passed.");

function click(dataset) {
  listeners.click({
    target: {
      closest(selector) {
        if (selector === "[data-consent]" && dataset.consent) return { dataset };
        if (selector === "[data-consent-reset]" && dataset.reset) return { dataset };
        if (selector === "[data-analytics-event]" && dataset.analyticsEvent) return { dataset };
        return null;
      }
    }
  });
}
