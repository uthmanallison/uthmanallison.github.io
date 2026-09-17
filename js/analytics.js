(() => {
  "use strict";

  const measurementId = "G-VWG0C7WTQ4";
  const storageKey = "portfolio-analytics-consent";
  const allowedEvents = new Set(["project_open", "source_open", "resume_download", "contact_click"]);
  const banner = document.querySelector("[data-consent-banner]");
  const status = document.querySelector("[data-consent-status]");
  let choice = readChoice();
  let loaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });

  if (choice === "accepted") {
    enableAnalytics();
  } else if (choice !== "declined" && banner) {
    banner.hidden = false;
  }

  document.addEventListener("click", (event) => {
    const consentButton = event.target.closest("[data-consent]");
    if (consentButton) {
      setChoice(consentButton.dataset.consent);
      return;
    }

    const resetButton = event.target.closest("[data-consent-reset]");
    if (resetButton) {
      setChoice("unset");
      return;
    }

    const tracked = event.target.closest("[data-analytics-event]");
    if (!tracked || choice !== "accepted") return;
    const eventName = tracked.dataset.analyticsEvent;
    if (!allowedEvents.has(eventName)) return;
    window.gtag("event", eventName, { link_label: tracked.dataset.analyticsLabel || "unlabelled" });
  });

  function enableAnalytics() {
    choice = "accepted";
    window.gtag("consent", "update", { analytics_storage: "granted" });
    if (loaded) return;
    loaded = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.onload = () => {
      window.gtag("js", new Date());
      window.gtag("config", measurementId, {
        anonymize_ip: true,
        allow_google_signals: false,
        send_page_view: true
      });
    };
    document.head.append(script);
  }

  function setChoice(nextChoice) {
    choice = nextChoice;
    writeChoice(nextChoice === "unset" ? "" : nextChoice);
    if (nextChoice === "accepted") enableAnalytics();
    if (nextChoice !== "accepted") window.gtag("consent", "update", { analytics_storage: "denied" });
    if (banner) banner.hidden = nextChoice !== "unset";
    if (status) status.textContent = nextChoice === "accepted" ? "Analytics accepted." : nextChoice === "declined" ? "Analytics declined." : "Choose whether to allow analytics.";
    if (nextChoice !== "accepted" && loaded) window.location.reload();
  }

  function readChoice() {
    try { return localStorage.getItem(storageKey) || "unset"; }
    catch (_) { return "unset"; }
  }

  function writeChoice(value) {
    try { value ? localStorage.setItem(storageKey, value) : localStorage.removeItem(storageKey); }
    catch (_) { /* The choice still applies to this page. */ }
  }
})();
