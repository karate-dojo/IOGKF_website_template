(() => {
  "use strict";

  const script = document.currentScript;
  const measurementId = script?.dataset.measurementId;

  if (!script || !/^G-[A-Z0-9]{10}$/.test(measurementId || "")) {
    console.error("Analytics consent setup requires a valid GA4 Measurement ID.");
    return;
  }

  const consentVersion = script.dataset.consentVersion || "1";
  const storageKey = `dojo-analytics-consent-v${consentVersion}-${measurementId}`;
  const disableKey = `ga-disable-${measurementId}`;
  let consent = null;
  let analyticsLoaded = false;
  let reloading = false;
  let unsavedConsent = false;
  let consentStorage = null;

  window[disableKey] = true;
  try {
    consentStorage = window.localStorage;
  } catch (error) {
    console.warn("Analytics consent storage is unavailable.", error);
  }

  const parseConsent = (value) =>
    value === "accepted" || value === "rejected" ? value : null;

  const readConsent = () => {
    if (unsavedConsent || !consentStorage) {
      return consent;
    }
    try {
      return parseConsent(consentStorage.getItem(storageKey));
    } catch (error) {
      console.warn("Unable to read analytics consent from local storage.", error);
      return consent;
    }
  };

  const saveConsent = (value) => {
    consent = value;
    unsavedConsent = true;
    if (!consentStorage) {
      console.warn("Analytics consent applies to this page only; storage is unavailable.");
      return;
    }
    try {
      consentStorage.setItem(storageKey, value);
      unsavedConsent = false;
    } catch (error) {
      console.warn("Unable to save analytics consent to local storage.", error);
    }
  };

  const stopAnalytics = () => {
    window[disableKey] = true;
    if (analyticsLoaded && !reloading && !unsavedConsent) {
      // Denied storage alone still permits cookieless pings. Reload to remove
      // Google's runtime and its automatic event listeners after opting out.
      reloading = true;
      window.location.reload();
    }
  };

  const loadAnalytics = () => {
    if (reloading) {
      return;
    }
    window[disableKey] = false;
    if (analyticsLoaded) {
      return;
    }
    analyticsLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    window.gtag("event", "page_view");

    const googleTag = document.createElement("script");
    googleTag.async = true;
    googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    googleTag.onerror = () => {
      console.error("Failed to load the Google Analytics tag.");
    };
    document.head.appendChild(googleTag);
  };

  const createButton = (label, className, onClick) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    if (className) {
      button.className = className;
    }
    button.addEventListener("click", onClick);
    return button;
  };

  const mountConsentInterface = () => {
    const footer = document.querySelector('footer[role="contentinfo"]');
    if (!footer) {
      console.error("Analytics consent requires a site footer for cookie preferences.");
      return;
    }
    const banner = document.createElement("section");
    banner.className = "analytics-consent";
    banner.hidden = true;
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", script.dataset.regionLabel);

    const title = document.createElement("h2");
    title.textContent = script.dataset.bannerTitle;
    banner.appendChild(title);

    const message = document.createElement("p");
    message.textContent = script.dataset.bannerMessage;
    banner.appendChild(message);

    if (script.dataset.privacyNoticeUrl) {
      const privacyParagraph = document.createElement("p");
      const privacyLink = document.createElement("a");
      privacyLink.href = script.dataset.privacyNoticeUrl;
      privacyLink.textContent = script.dataset.privacyNoticeLabel;
      privacyParagraph.appendChild(privacyLink);
      banner.appendChild(privacyParagraph);
    }

    const actions = document.createElement("div");
    actions.className = "analytics-consent__actions";
    const accept = createButton(
      script.dataset.acceptLabel,
      "analytics-consent__accept",
      () => chooseConsent("accepted"),
    );
    const reject = createButton(
      script.dataset.rejectLabel,
      "",
      () => chooseConsent("rejected"),
    );
    actions.append(accept, reject);
    banner.appendChild(actions);
    document.body.appendChild(banner);

    const settings = createButton(
      script.dataset.settingsLabel,
      "analytics-consent-settings",
      () => {
        banner.hidden = false;
        settings.hidden = true;
        accept.focus();
      },
    );
    settings.hidden = true;
    const preferences = document.createElement("div");
    preferences.className = "analytics-consent-preferences";
    preferences.appendChild(settings);
    footer.appendChild(preferences);

    function chooseConsent(value) {
      saveConsent(value);
      applyConsent();
      if (!reloading) {
        settings.focus();
      }
    }

    function applyConsent() {
      const hadFocus = banner.contains(document.activeElement);
      banner.hidden = consent !== null;
      settings.hidden = consent === null;
      if (consent === "accepted") {
        loadAnalytics();
      } else {
        stopAnalytics();
      }
      if (hadFocus && banner.hidden && !reloading) {
        settings.focus();
      }
    }

    consent = readConsent();
    applyConsent();

    window.addEventListener("storage", (event) => {
      if (
        consentStorage &&
        event.storageArea === consentStorage &&
        (event.key === storageKey || event.key === null)
      ) {
        unsavedConsent = false;
        consent = readConsent();
        applyConsent();
      }
    });
    window.addEventListener("pageshow", () => {
      consent = readConsent();
      applyConsent();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountConsentInterface, {
      once: true,
    });
  } else {
    mountConsentInterface();
  }
})();
