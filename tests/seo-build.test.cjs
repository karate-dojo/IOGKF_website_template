const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const test = require("node:test");

const root = join(__dirname, "..");

function build(t, customMetadata) {
  const directory = mkdtempSync(join(tmpdir(), "dojo-seo-build-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const config = join(directory, "seo.toml");
  let settings = "";
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
    "--baseURL", "https://example.com/", "--minify",
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
});
