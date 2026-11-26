const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const test = require("node:test");

const root = join(__dirname, "..");

function metaContent(html, attribute, name) {
  const match = html.match(new RegExp(`<meta ${attribute}=["']?${name}["']? content=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`));
  assert.ok(match, `Missing ${name} metadata`);
  const entities = { "&lt;": "<", "&gt;": ">", "&amp;": "&", "&#34;": '"', "&#39;": "'" };
  return (match[1] ?? match[2] ?? match[3]).replace(/&(?:lt|gt|amp|#34|#39);/g, (entity) => entities[entity]);
}

function build(t, customMetadata = {}, options = {}) {
  const directory = mkdtempSync(join(tmpdir(), "dojo-seo-build-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const config = join(directory, "seo.toml");
  let settings = options.config || "";
  for (const [language, values] of Object.entries(customMetadata)) {
    const contentDir = join(directory, language);
    cpSync(join(root, "content/en"), contentDir, { recursive: true });
    settings += `
[languages.${language}]
title = "${values.siteTitle}"
contentDir = "${contentDir}"
weight = ${language === "en" ? 1 : language === "pt" ? 2 : 3}
`;
    for (const path of ["_index.md", "instructors.md", "contact.md", "schedule.md"]) {
      const file = join(contentDir, path);
      const original = readFileSync(file, "utf8");
      const metadata = `\ntitle: "${values.pageTitle}"\ndescription: '${values.description}'\n` +
        (values.featuredImage === undefined ? "" : `featured_image: '${values.featuredImage}'\n`) +
        (values.private ? "private: true\n" : "") +
        (values.seoTitle === undefined ? "" : `seo:\n  title: '${values.seoTitle}'\n`);
      writeFileSync(file, original.replace(/^(---\r?\n)[\s\S]*?(\r?\n---)/,
        (_, start, end) => {
          const frontMatter = original.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]
            .replace(/^title:.*$/m, "").replace(/^description:.*$/m, "");
          return start + frontMatter + metadata + end;
        }));
    }
  }
  writeFileSync(config, settings);
  const destination = join(directory, "public");
  const result = spawnSync("hugo", [
    "--config", `hugo.toml,${config}`, "--destination", destination,
    "--baseURL", options.baseURL || "https://example.com/", "--minify",
    "--environment", options.environment || "production",
  ], { cwd: root, encoding: "utf8" });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return (path) => readFileSync(join(destination, path), "utf8");
}

test("omitted or empty SEO titles preserve language-specific title fallback", (t) => {
  const page = build(t, {
    en: { siteTitle: "English dojo", pageTitle: "Instructors", description: "English description" },
    pt: { siteTitle: "Dojo português", pageTitle: "Instrutores", description: "Descrição portuguesa", seoTitle: "" },
  });
  assert.match(page("instructors/index.html"), /<title>Instructors \| English dojo<\/title>/);
  assert.match(page("pt/instructors/index.html"), /<title>Instrutores \| Dojo português<\/title>/);
});

test("SEO metadata is independently translated and leaves visible titles unchanged", (t) => {
  const languages = {
    en: { siteTitle: "English dojo", pageTitle: "Instructors", description: "Meet our instructors", seoTitle: "Goju-Ryu & Training | English dojo" },
    pt: { siteTitle: "Dojo português", pageTitle: "Instrutores", description: "Conheça os instrutores", seoTitle: "Karate Goju-Ryu | Dojo português" },
    es: { siteTitle: "Dojo español", pageTitle: "Instructores", description: "Conoce a los instructores", seoTitle: "Karate Goju-Ryu | Dojo español" },
  };
  const page = build(t, languages);
  for (const [language, values] of Object.entries(languages)) {
    const prefix = language === "en" ? "" : `${language}/`;
    for (const path of ["index.html", "instructors/index.html", "contact/index.html", "schedule/index.html"]) {
      const html = page(prefix + path);
      const title = html.match(/<title>(.*?)<\/title>/)[1].replace(/&amp;/g, "&");
      assert.equal(title, values.seoTitle);
      assert.ok(html.includes(values.description));
      assert.equal((html.match(/<title>/g) || []).length, 1);
      assert.equal((html.match(/name=description\b/g) || []).length, 1);
      assert.match(html, /rel=canonical/);
      assert.match(html, /property=["']?og:title/);
      assert.equal(metaContent(html, "property", "og:title"), values.seoTitle);
      assert.equal(metaContent(html, "name", "twitter:title"), values.seoTitle);
      assert.equal(metaContent(html, "property", "og:description"), values.description);
      assert.equal(metaContent(html, "name", "twitter:description"), values.description);
    }
    const schedule = page(prefix + "schedule/index.html");
    assert.ok(schedule.includes(`>${values.pageTitle}</h1>`));
  }
});

test("SEO titles are escaped rather than treated as HTML", (t) => {
  const page = build(t, {
    en: { siteTitle: "Test dojo", pageTitle: "Contact", description: "Contact us", seoTitle: '<script>alert("test")</script> | Test dojo' },
  });
  const html = page("contact/index.html");
  assert.match(html, /<title>&lt;script(?:&gt;|>)/);
  assert.doesNotMatch(html, /<title><script>/);
  assert.equal(metaContent(html, "property", "og:title"), '<script>alert("test")</script> | Test dojo');
  assert.equal(metaContent(html, "name", "twitter:title"), '<script>alert("test")</script> | Test dojo');
});

test("bilingual SEO discovery, headings, logo and contact links support Pages subpaths", (t) => {
  const page = build(t, {}, { baseURL: "https://example.com/dojo/" });
  // Newer Hugo versions inherit the root languageCode into the default language.
  const englishCode = page("en/sitemap.xml").match(/hreflang="(en(?:-us)?)"/)?.[1];
  assert.ok(englishCode);
  for (const [language, phone, locale, name] of [
    ["en", "+14155550123", "en_US", "Sakura Goju-Ryu Dojo"],
    ["pt", "+351215550123", "pt_PT", "Dojo Sakura Goju-Ryu"],
  ]) {
    const prefix = language === "en" ? "" : "pt/";
    for (const slug of ["", "contact/", "schedule/", "instructors/"]) {
      const html = page(`${prefix}${slug}index.html`);
      assert.ok(html.includes(`rel=canonical href=https://example.com/dojo/${prefix}${slug}`));
      for (const alternate of ["en", "pt"]) {
        assert.ok(html.includes(`rel=alternate hreflang=${alternate === "en" ? englishCode : alternate} href=https://example.com/dojo/${alternate === "en" ? "" : "pt/"}${slug}`));
      }
      assert.equal((html.match(/<h1\b/g) || []).length, 1, `${prefix}${slug} needs one main heading`);
      assert.equal(metaContent(html, "property", "og:locale"), locale);
      assert.equal(metaContent(html, "property", "og:image"), "https://example.com/dojo/images/logo.png");
      assert.equal((html.match(/property=["']?og:title\b/g) || []).length, 1);
      assert.equal((html.match(/name=["']?twitter:title\b/g) || []).length, 1);
    }
    const home = page(`${prefix}index.html`);
    assert.match(home, new RegExp(`<h1[^>]*>${name}</h1>`));
    assert.ok(home.includes(`alt="${name}"`));
    assert.match(home, /width=128 height=128/);
    assert.ok(home.includes("src=/dojo/images/logo.png"));
    assert.ok(home.includes(`href=/dojo/${prefix}contact/`));
    assert.ok(home.includes(`href=/dojo/${prefix}schedule/`));
    assert.ok(home.includes(`href=tel:${phone}`));
    assert.ok(page(`${prefix}contact/index.html`).includes(`href=tel:${phone}`));
    assert.equal(metaContent(page(`${prefix}404.html`), "name", "robots"), "noindex, nofollow");
    assert.doesNotMatch(page(`${prefix}404.html`), /hreflang=/);
    const sitemap = page(`${language}/sitemap.xml`);
    assert.ok(sitemap.includes(`https://example.com/dojo/${prefix}contact/`));
    assert.ok(sitemap.includes(`hreflang="${englishCode}"`));
    assert.match(sitemap, /hreflang="pt"/);
    assert.doesNotMatch(sitemap, /404\.html/);
  }
  assert.match(page("robots.txt"), /Sitemap: https:\/\/example.com\/dojo\/sitemap.xml/);
  assert.match(page("sitemap.xml"), /https:\/\/example.com\/dojo\/en\/sitemap.xml/);
  assert.match(page("sitemap.xml"), /https:\/\/example.com\/dojo\/pt\/sitemap.xml/);
});

test("featured homepage and instructor headers do not duplicate main headings", (t) => {
  const page = build(t, {
    en: { siteTitle: "Example dojo", pageTitle: "Example page", description: "A description", featuredImage: "/images/hero.jpg" },
  });
  for (const path of ["index.html", "instructors/index.html"]) {
    const html = page(path);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.equal(metaContent(html, "property", "og:image"), "https://example.com/images/hero.jpg");
  }
});

test("private pages are not advertised as language alternatives", (t) => {
  const page = build(t, {
    pt: { siteTitle: "Example dojo", pageTitle: "Private page", description: "A description", private: true },
  });
  assert.doesNotMatch(page("contact/index.html"), /hreflang=pt/);
  const html = page("pt/contact/index.html");
  assert.doesNotMatch(html, /hreflang=/);
  assert.equal(metaContent(html, "name", "robots"), "noindex, nofollow");
});

test("single-language sites omit alternate links and retain sitemap discovery", (t) => {
  const page = build(t, {}, { config: 'disableLanguages = ["pt"]\n[params]\nlogo_alt = "Our federation emblem"\n' });
  const html = page("index.html");
  assert.doesNotMatch(html, /hreflang=|og:locale:alternate/);
  assert.ok(html.includes('alt="Our federation emblem"'));
  assert.match(page("robots.txt"), /Sitemap: https:\/\/example.com\/sitemap.xml/);
  assert.match(page("sitemap.xml"), /https:\/\/example.com\/contact\//);
});

test("development output discourages indexing and missing dojo data keeps fallback headings", (t) => {
  const dataDir = mkdtempSync(join(tmpdir(), "dojo-seo-empty-"));
  t.after(() => rmSync(dataDir, { recursive: true, force: true }));
  const page = build(t, {}, { config: `dataDir = "${dataDir}"\n`, environment: "development" });
  assert.equal(metaContent(page("index.html"), "name", "robots"), "noindex, nofollow");
  assert.match(page("index.html"), /<h1[^>]*>Sakura Dojo<\/h1>/);
  assert.match(page("robots.txt"), /Disallow: \//);
  assert.doesNotMatch(page("robots.txt"), /Sitemap:/);
});
