# Analytics Setup

This template supports optional Google Analytics 4 (GA4). Google's standard GA4 offering is free; Google Analytics 360 is a paid enterprise service. Analytics is disabled by default. Each dojo must use its own GA4 property and Measurement ID; a fork must never send another dojo's website data to the template author's account.

## Create a GA4 property

1. Sign in to [Google Analytics](https://analytics.google.com/) with the Google account that will own the dojo's analytics.
2. Create an account or property for the dojo, then add a **Web** data stream for its website.
3. Copy the stream's Measurement ID. It has the form `G-XXXXXXXXXX`.
4. To share access with your sensei, open **Admin → Property access management**, invite their Google account email, and choose the appropriate role. Do not share your Google password.

## Enable analytics for this dojo

In `hugo.toml`, update the analytics settings:

```toml
[params.analytics]
  enabled = true
  provider = "google-analytics"
  measurement_id = "G-XXXXXXXXXX"
  consent_version = "1"
  privacy_notice_url = "/privacy/"
```

Replace the example ID with the Measurement ID for this dojo's property. The template only loads GA4 when analytics is explicitly enabled, the provider is supported, and the ID has the expected format. Invalid or unsupported settings produce a Hugo build warning and do not load analytics.

To disable analytics, set `enabled = false` or clear the Measurement ID. Never put Google account credentials, passwords, or API secrets in this file. Measurement IDs are identifiers, not credentials.

Use **only** `params.analytics` for GA4. Keep `[privacy.googleAnalytics] disable = true` in `hugo.toml`: this blocks Ananke's separate, non-consent-aware analytics path. Builds fail if this protection is removed or overridden, or if `services.googleAnalytics.id` (or the legacy `googleAnalytics` setting) is configured. Do not add a second Google tag or a Tag Manager snippet manually.

### Privacy notice link and languages

`privacy_notice_url` is optional and empty by default. Create your dojo's privacy notice before setting this link; the template does not generate legal text or create the page automatically. Use a site-relative path beginning with `/`, such as `/privacy/`, or a full HTTPS URL. Local paths use Hugo's `relLangURL` so they respect the current language and GitHub Pages repository subpaths.

If your translated notices use different paths, override this setting per language:

```toml
[languages.en.params.analytics]
  privacy_notice_url = "/privacy/"

[languages.pt.params.analytics]
  privacy_notice_url = "/privacidade/"
```

The other analytics settings are inherited from the global configuration. Invalid notice URLs fail the build rather than render a broken or unsafe link.

### Consent translations for additional languages

The interface is not limited to English and Portuguese. For every new language, copy the following entries from `i18n/en.toml` into `i18n/{lang}.toml` and translate their `other` values:

- `analytics_consent_title`
- `analytics_consent_message`
- `analytics_consent_accept`
- `analytics_consent_reject`
- `analytics_consent_settings`
- `analytics_consent_region` (the accessible region label)
- `analytics_consent_privacy_notice`

Hugo resolves these strings in the language of the current page. If an entry is absent, it falls back to `defaultContentLanguage`; keep the complete set in that language's translation file to avoid empty labels. Build with `hugo --printI18nWarnings` to find missing or fallback translations. No JavaScript or template changes are needed to add translations. Consent is shared between language variants on the same origin using the same property and consent version.

## Visitor consent behavior

When configured, the site explains that optional analytics cookies help understand how visitors use the website, with **Accept analytics cookies** and **Reject** choices. The Google Analytics script is not requested until the visitor accepts. Rejecting means GA4 is not loaded. After either choice the banner closes completely; no floating preferences button remains. Visitors can use **Cookie preferences** in the site footer to reopen the banner and change or withdraw their choice. This is a keyboard-accessible button styled as a discreet link.

The generic banner wording does not replace a privacy notice: the dojo's notice should still identify Google Analytics and explain its purpose and data handling.

If GA4 has already been loaded, withdrawal immediately sets Google's per-property collection-disable flag and **reloads the current page** to remove the tag's runtime and automatic event listeners. The reloaded page does not load GA4. Simply setting `analytics_storage` to `denied` would still permit cookieless measurements, so this integration does not rely on that alone. Requests already in flight may finish; withdrawal cannot undo previously collected data and does not erase existing analytics cookies.

Choices are synchronized with other open tabs for the same property and consent version using browser storage events. Removing the stored choice or clearing local storage resets consent to undecided; open tabs that loaded GA4 disable collection and reload. Pages restored from the browser's back/forward cache also recheck the stored choice.

### Consent lifetime and versioning

The choice is stored in local storage for this Measurement ID and `consent_version`. It has **no automatic expiry**; it remains until the visitor clears browser storage or changes their choice. Changing the Measurement ID or `consent_version` prompts for consent again on subsequent page loads. Use a non-empty string containing letters, numbers, underscores, or hyphens, for example `"2"`, when your analytics purpose or privacy notice changes materially. Older stored choices are no longer used. Previously open pages receive the new configuration only after reloading.

The prompt uses the site's Hugo i18n files, with English and Portuguese translations included and support for additional languages as described above. If JavaScript is unavailable or consent storage cannot be read, analytics remains off unless the visitor explicitly accepts in the current page session.

If browser storage becomes unwritable, changes apply only to the current page and a warning is logged in the browser console. Withdrawal still disables collection, but does not reload the page when its rejection could not be saved: reloading could otherwise restore an older saved acceptance. Visitors should clear the stored choice or restore storage access to make that withdrawal persistent. This browser limitation cannot guarantee a saved preference for future visits.

## Privacy responsibilities

Analytics is optional. Each dojo is responsible for deciding whether to use it, providing an appropriate privacy notice, and checking the requirements that apply to its organization and visitors. This template's consent interface is a technical feature, not a guarantee of legal compliance. Review the dojo's privacy notice and applicable requirements before enabling analytics.

## Development and verification

Analytics is automatically omitted under `hugo server`, even with a production Measurement ID and a saved acceptance. Static builds can include analytics, including builds with `--environment development`; the safeguard detects the live server, not the environment name. To verify the consent interface, build with a separate test property and serve the generated files with a static HTTP server.

Regression checks require Node.js 20+ and Hugo Extended with the Ananke submodule initialized:

```bash
git submodule update --init --recursive
node --test tests/analytics-consent.test.cjs tests/analytics-build.test.cjs
```

These checks exercise consent state transitions with an isolated DOM harness and validate Hugo output, warnings, configuration conflicts, translations, and the development-server safeguard. They do not send data to Google. Before launch, also verify keyboard navigation, short screens and high zoom, and actual network behavior with your test property in a browser. Browser extensions or network policies can block GA4 even after acceptance.

The GitHub Pages workflow runs these checks before building and deploying the site.

### Banner missing in Safari or another browser

A saved acceptance or rejection hides the banner by design; use the footer's **Cookie preferences** control to reopen it. To check a fresh visit, use a private window or clear the site's stored consent. Content blockers may block GA4 even when the site-hosted banner works; temporarily disable them to diagnose, not to bypass a visitor's choice. If the footer control is also absent, check that JavaScript is enabled and the consent script loaded without browser-console errors. Analytics is intentionally absent under `hugo server`.
