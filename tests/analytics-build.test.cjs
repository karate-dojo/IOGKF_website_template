const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");
const { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const net = require("node:net");
const { once } = require("node:events");
const test = require("node:test");

const root = join(__dirname, "..");
const enabledConfig = `
[params.analytics]
enabled = true
provider = "google-analytics"
measurement_id = "G-TEST123456"
consent_version = "2"
privacy_notice_url = "/privacy/"
`;
const integrationPattern = /analytics-consent|data-measurement-id|googletagmanager/;

function build(extraConfig = "", args = [], translations = {}) {
  const directory = mkdtempSync(join(tmpdir(), "dojo-analytics-build-"));
  const config = join(directory, "analytics.toml");
  const destination = join(directory, "public");
  if (Object.keys(translations).length) {
    const i18nDir = join(directory, "i18n");
    cpSync(join(root, "i18n"), i18nDir, { recursive: true });
    for (const [language, content] of Object.entries(translations)) {
      writeFileSync(join(i18nDir, `${language}.toml`), content);
    }
    extraConfig = `i18nDir = "${i18nDir}"\n` + extraConfig;
  }
  writeFileSync(config, extraConfig);
  const result = spawnSync("hugo", [
    "--config", `hugo.toml,${config}`,
    "--destination", destination,
    "--minify",
    ...args,
  ], { cwd: root, encoding: "utf8" });
  if (result.error) {
    rmSync(directory, { recursive: true, force: true });
    throw result.error;
  }
  return {
    ...result,
    output: result.stdout + result.stderr,
    page: (path = "index.html") => readFileSync(join(destination, path), "utf8"),
    files: () => readdirSync(destination, { recursive: true }),
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
}

test("default build emits no analytics references or assets", (t) => {
  const result = build();
  t.after(result.cleanup);
  assert.equal(result.status, 0, result.output);
  assert.doesNotMatch(result.page(), integrationPattern);
  assert.doesNotMatch(result.page("pt/index.html"), integrationPattern);
  assert.equal(result.files().some((file) => file.includes("analytics-consent")), false);
});

test("enabled build emits localized consent settings with repository-relative paths", (t) => {
  const result = build(enabledConfig + `
[languages.pt.params.analytics]
privacy_notice_url = "/privacidade/"
`, ["--baseURL", "https://example.com/dojo/"]);
  t.after(result.cleanup);
  assert.equal(result.status, 0, result.output);
  const en = result.page();
  const pt = result.page("pt/index.html");
  for (const page of [en, pt]) {
    assert.match(page, /data-measurement-id=["']?G-TEST123456/);
    assert.match(page, /data-consent-version=["']?2/);
    assert.match(page, /src=["']?\/dojo\/js\/analytics-consent\.min\.js/);
    assert.doesNotMatch(page, /googletagmanager/);
  }
  assert.match(en, /data-privacy-notice-url=["']?\/dojo\/privacy\//);
  assert.match(pt, /data-privacy-notice-url=["']?\/dojo\/pt\/privacidade\//);
  assert.match(en, /Accept analytics cookies/);
  assert.match(pt, /Aceitar cookies de análise/);
  assert.match(en, /Cookie preferences/);
  assert.match(pt, /Preferências de cookies/);
  assert.doesNotMatch(en, /Google Analytics to measure/);
});

test("omitting the privacy notice does not insert a link to the site root", (t) => {
  const result = build(enabledConfig.replace('privacy_notice_url = "/privacy/"', 'privacy_notice_url = ""'));
  t.after(result.cleanup);
  assert.equal(result.status, 0, result.output);
  assert.match(result.page(), /data-privacy-notice-url(?:=(?:""|''))?(?=\s|>)/);
});

const spanishConfig = `
[languages.es]
title = "Test dojo"
weight = 3
contentDir = "content/en"
languageName = "Español"
`;

test("a new language supplies every consent label through its i18n file", (t) => {
  const translations = `
[analytics_consent_title]
other = "Opciones de privacidad"
[analytics_consent_message]
other = "Permitir Google Analytics?"
[analytics_consent_accept]
other = "Permitir analisis"
[analytics_consent_reject]
other = "Rechazar analisis"
[analytics_consent_settings]
other = "Ajustes de privacidad"
[analytics_consent_region]
other = "Opciones de consentimiento"
[analytics_consent_privacy_notice]
other = "Leer aviso de privacidad"
`;
  const result = build(enabledConfig + spanishConfig, [], { es: translations });
  t.after(result.cleanup);
  assert.equal(result.status, 0, result.output);
  const html = result.page("es/index.html");
  for (const label of [
    "Opciones de privacidad", "Permitir Google Analytics?", "Permitir analisis",
    "Rechazar analisis", "Ajustes de privacidad", "Opciones de consentimiento",
    "Leer aviso de privacidad",
  ]) {
    assert.ok(html.includes(label), `Missing Spanish consent text: ${label}`);
  }
  assert.match(html, /data-privacy-notice-url=["']?\/es\/privacy\//);
  assert.doesNotMatch(html, /Accept analytics cookies|Your privacy choices/);
});

test("missing consent translations fall back to the default language and produce i18n warnings", (t) => {
  const result = build(enabledConfig + spanishConfig, ["--printI18nWarnings"], {
    es: '[analytics_consent_title]\nother = "Opciones de privacidad"\n',
  });
  t.after(result.cleanup);
  assert.equal(result.status, 0, result.output);
  assert.match(result.page("es/index.html"), /Opciones de privacidad/);
  assert.match(result.page("es/index.html"), /Accept analytics cookies/);
  assert.match(result.output, /analytics_consent_accept/);
});

test("translation fallback follows a Portuguese default rather than hardcoded English", (t) => {
  const result = build('defaultContentLanguage = "pt"\n' + enabledConfig + spanishConfig, [], {
    es: '[analytics_consent_title]\nother = "Opciones de privacidad"\n',
  });
  t.after(result.cleanup);
  assert.equal(result.status, 0, result.output);
  assert.match(result.page("es/index.html"), /Opciones de privacidad/);
  assert.match(result.page("es/index.html"), /Aceitar cookies de análise/);
  assert.doesNotMatch(result.page("es/index.html"), /Accept analytics cookies/);
});

for (const [name, config, warning] of [
  ["missing ID", enabledConfig.replace("G-TEST123456", ""), /not a valid GA4/],
  ["invalid ID", enabledConfig.replace("G-TEST123456", "G-bad"), /not a valid GA4/],
  ["unsupported provider", enabledConfig.replace("google-analytics", "unknown"), /unsupported/],
]) {
  test(`${name} warns and does not emit analytics`, (t) => {
    const result = build(config);
    t.after(result.cleanup);
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, warning);
    assert.doesNotMatch(result.page(), integrationPattern);
  });
}

for (const [name, config] of [
  ["modern built-in analytics", '\n[services.googleAnalytics]\nid = "G-TEST123456"\n'],
  ["legacy built-in analytics", 'googleAnalytics = "G-TEST123456"\n'],
  ["disabled theme protection", "\n[privacy.googleAnalytics]\ndisable = false\n"],
]) {
  test(`${name} fails the build, including when custom analytics is off`, (t) => {
    const result = build(config);
    t.after(result.cleanup);
    assert.notEqual(result.status, 0);
    assert.match(result.output, /Use params\.analytics/);
  });
}

for (const [name, config] of [
  ["empty consent version", enabledConfig.replace('consent_version = "2"', 'consent_version = ""')],
  ["invalid consent version", enabledConfig.replace('consent_version = "2"', 'consent_version = "bad version"')],
  ["invalid privacy URL", enabledConfig.replace('privacy_notice_url = "/privacy/"', 'privacy_notice_url = "javascript:alert(1)"')],
  ["protocol-relative privacy URL", enabledConfig.replace('privacy_notice_url = "/privacy/"', 'privacy_notice_url = "//example.com/privacy/"')],
]) {
  test(`${name} fails the build`, (t) => {
    const result = build(config);
    t.after(result.cleanup);
    assert.notEqual(result.status, 0);
    assert.match(result.output, /Analytics (consent_version|privacy_notice_url)/);
  });
}

test("hugo server omits analytics even with production environment and valid settings", async () => {
  const directory = mkdtempSync(join(tmpdir(), "dojo-analytics-server-"));
  let child;
  try {
    const reservation = net.createServer();
    reservation.listen(0, "127.0.0.1");
    await once(reservation, "listening");
    const port = reservation.address().port;
    await new Promise((resolve, reject) =>
      reservation.close((error) => error ? reject(error) : resolve()));
    const config = join(directory, "analytics.toml");
    writeFileSync(config, enabledConfig);
    child = spawn("hugo", [
      "server", "--config", `hugo.toml,${config}`,
      "--destination", join(directory, "public"),
      "--bind", "127.0.0.1", "--port", String(port),
      "--disableLiveReload", "--environment", "production",
    ], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    let spawnError;
    child.stdout.on("data", (data) => output += data);
    child.stderr.on("data", (data) => output += data);
    child.on("error", (error) => spawnError = error);
    let html;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null) throw new Error(`Hugo server exited: ${output}`);
      try {
        const response = await fetch(`http://127.0.0.1:${port}/`);
        if (response.ok) {
          html = await response.text();
          break;
        }
      } catch (error) {
        if (error.cause?.code !== "ECONNREFUSED") throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(html, `Hugo server did not become responsive: ${output}`);
    assert.doesNotMatch(html, integrationPattern);
  } finally {
    if (child?.pid && child.exitCode === null) {
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      await exited;
    }
    rmSync(directory, { recursive: true, force: true });
  }
});
