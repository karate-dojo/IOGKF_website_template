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

`description` supplies the meta description and social descriptions. Google may select a different title or snippet from the visible page content. Open Graph and Twitter titles use the same localized `seo.title` or fallback as the HTML title.

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

Public translated pages include reciprocal `hreflang` links using Hugo's language code (or language identifier if no code is set), consistent with the generated sitemap. Single-language sites omit these links. Configure a sharing locale in each language's parameters (for example, `[languages.pt.params]` with `social_locale = "pt_PT"`); do not assume every Portuguese-speaking dojo is in Portugal.

## Hosting and images

Keep the deployed origin in the build's `--baseURL`, including any GitHub Pages repository subpath and a trailing slash. The existing Pages workflow supplies this automatically. Do not copy another dojo's production URL into this template. Canonical URLs, language alternates, sharing images, and the generated `robots.txt` sitemap URL follow this base URL.

Production pages allow indexing unless marked `private: true`; 404 pages and development builds always use `noindex, nofollow`. Development `robots.txt` disallows crawling. On repository-subpath hosting, the generated file lives under that subpath; crawlers only consult the host-root `/robots.txt`, which this repository cannot control. The sitemap remains directly available at the deployed `sitemap.xml` URL.

Social images use page/site `images`, the page's featured image or cover resource, then the site's `featured_image`. The homepage logo remains `static/images/logo.png`; intrinsic dimensions are read from that file instead of assuming a replacement logo is square. Alt text defaults to the localized dojo name or site title. Override `logo_alt` in language-specific parameters if the image depicts a federation emblem rather than the dojo itself.

The homepage uses the dojo name as its H1. Instructor content uses an H1 introduction and H2 philosophy with scoped CSS retaining the prior heading sizes. Keep this hierarchy when replacing the example content. No business structured data is emitted because the sample addresses and contact details are not verified facts; a dojo-specific implementation should use only confirmed information.

## Template maintenance and verification

`layouts/_default/baseof.html` overrides the pinned Ananke base layout to route titles and social metadata through `layouts/partials/seo/`, add language alternates, and prevent 404 indexing. Compare this override when upgrading the theme. Analytics and consent behavior are unchanged.

Run the regression checks and build:

```bash
node --test tests/*.test.cjs
hugo --gc --minify
```

Inspect each language's generated `<title>` and description. SEO checks cover title fallbacks, independently translated sharing metadata, an added third language, escaped text, semantic headings, normalized telephone links, logo dimensions/alt text, subpath URLs, sitemap discovery, 404/development indexing, and single-language and missing-data fallbacks.
