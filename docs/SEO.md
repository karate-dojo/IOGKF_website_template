# Page Titles and Descriptions

Hugo and Ananke provide page titles, meta descriptions, canonical URLs, indexing directives, and Open Graph/Twitter metadata. Each dojo can customize page metadata without changing navigation labels or visible headings.

## Per-page metadata

Add `seo.title` and `description` to the front matter of the appropriate content file:

```yaml
---
title: "Home"
description: "Discover our Goju-Ryu dojo, meet the instructors, and find training times and contact details."
seo:
  title: "Goju-Ryu Karate | Your Dojo"
---
```

`seo.title` is the **complete** browser/search title; the site name is not appended again. Keep `title` as the existing short page label. If `seo.title` is absent or empty, the existing Ananke title behavior is preserved: page title followed by the site's title. Text is HTML-escaped automatically.

`description` supplies the meta description and the descriptions used by Hugo's social metadata. Google may select a different title or snippet from the visible page content. `seo.title` only overrides the HTML title; social titles retain the existing page-title behavior.

Do not add a `meta keywords` list. Write accurate, natural descriptions supported by the visible content, and include names, locations, qualifications, or services only when verified.

## Languages

Metadata belongs to the page's language, not a global hardcoded translation:

| Page | English | Portuguese |
|------|---------|------------|
| Homepage | `content/en/_index.md` | `content/pt/_index.md` |
| Instructors | `content/en/instructors.md` | `content/pt/instructors.md` |
| Contact | `content/en/contact.md` | `content/pt/contact.md` |
| Schedule | `content/en/schedule.md` | `content/pt/schedule.md` |

For another language, set the fields in `content/{lang}/` after registering that language in Hugo. No template or JavaScript changes are required. These are editorial translations in content front matter, not UI strings in `i18n/`. When an SEO title is omitted, the fallback uses that page's existing title and its language's site title.

Visible dojo introductions and instructor details continue to use language-scoped `data/{lang}/dojo.yaml` and `data/{lang}/instructors.yaml`. Keep those consistent with the metadata. This feature does not add JSON-LD, new sharing images, or legal content automatically.

## Template maintenance and verification

`layouts/_default/baseof.html` overrides the pinned Ananke base layout only to route its title block through `layouts/partials/seo/title.html`. Preserve the rest of Ananke's behavior and compare this override when upgrading the theme.

Run the regression checks and build:

```bash
node --test tests/*.test.cjs
hugo --gc --minify
```

Inspect each language's generated `<title>` and description. SEO checks cover default behavior, independently translated metadata, an added third language, escaped text, and unchanged visible headings.
