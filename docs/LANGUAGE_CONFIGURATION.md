# Language Configuration Guide

This Hugo site supports flexible language configuration with two approaches: the new simplified data-driven system (recommended) and the traditional Hugo-only configuration.

## 🎯 Recommended: Data-Driven Menu System

The site now uses a simplified approach where:

- **Languages are configured manually in hugo.toml** (you control which languages to support)
- **Menus are managed in data/{lang}/menu.yaml files** (cleaner and easier to maintain)
- **Language switcher automatically shows/hides** based on your configuration

### Language Configuration (hugo.toml)

Configure supported languages in the `[languages]` section:

```toml
defaultContentLanguage = "en"

[languages]
  [languages.en]
    title = "Sakura Dojo"
    weight = 1
    contentDir = "content/en"
    languageName = "English"

  [languages.pt]
    title = "Dojo Sakura"
    weight = 2
    contentDir = "content/pt"
    languageName = "Português"

[params]
  show_language_switcher = true  # Set to false to always hide
```

### Menu Configuration (Data Files)

Create menu files for each language in `data/{lang}/menu.yaml`:

**English Menu (data/en/menu.yaml):**

```yaml
menu:
  - name: "Goju Ryu"
    url: "/goju-ryu/"
    weight: 1
  - name: "Instructors"
    url: "/instructors/"
    weight: 3
  - name: "Schedule"
    url: "/schedule/"
    weight: 4
```

**Portuguese Menu (data/pt/menu.yaml):**

```yaml
menu:
  - name: "Goju Ryu"
    url: "/pt/goju-ryu/"
    weight: 1
  - name: "Instrutores"
    url: "/pt/instructors/"
    weight: 3
  - name: "Horários"
    url: "/pt/schedule/"
    weight: 4
```

### Optional Visual Enhancements (data/site_config.yaml)

Add flags and enhanced names for the language switcher:

```yaml
languages:
  en:
    name: "English"
    flag: "🇺🇸"
  pt:
    name: "Português"
    flag: "🇵🇹"
  es:
    name: "Español"
    flag: "🇪🇸"
```

## 📝 Adding a New Language

### Step 1: Add to hugo.toml

```toml
[languages.es]
  title = "Dojo Sakura"
  weight = 3
  contentDir = "content/es"
  languageName = "Español"
```

### Step 2: Create Menu File

Create `data/es/menu.yaml`:

```yaml
menu:
  - name: "Instructores"
    url: "/es/instructors/"
    weight: 3
  - name: "Horario"
    url: "/es/schedule/"
    weight: 4
```

### Step 3: Create Content Directory

Create `content/es/` and add your Spanish content files.

The language switcher will automatically appear when multiple languages are configured.

### Step 4: Translate Interface Strings

Copy `i18n/en.toml` to `i18n/{lang}.toml` and translate its values. This includes the optional analytics consent banner, its buttons, the accessible region label, and the privacy-notice link. See [Consent translations for additional languages](ANALYTICS.md#consent-translations-for-additional-languages) for the complete analytics key list.

Hugo falls back to `defaultContentLanguage` for missing translations. Keep that language's interface strings complete, and use `hugo --printI18nWarnings` to find untranslated entries.

## 🎛️ Configuration Options

### Single Language Setup

Keep only one language in hugo.toml:

```toml
[languages]
  [languages.en]
    title = "My Dojo"
    weight = 1
    contentDir = "content/en"
    languageName = "English"
```

The language switcher will automatically hide.

### Always Hide Language Switcher

```toml
[params]
  show_language_switcher = false
```

### Custom Menu Items

Edit the appropriate `data/{lang}/menu.yaml` file:

```yaml
menu:
  - name: "Custom Page"
    url: "/custom/"
    weight: 10
```

---

**Traditional Approach:**

- ⚠️ Everything in hugo.toml (can get repetitive)
- ⚠️ Manual menu management for each language
- ✅ Standard Hugo configuration

## Testing Your Configuration

1. Start Hugo server: `hugo server`
2. Visit `http://localhost:1313/`
3. Test language switching (if multiple languages configured)
4. Verify URLs:
   - English: `http://localhost:1313/`
   - Other languages: `http://localhost:1313/{lang}/`

## Troubleshooting

**Language switcher not showing:**

- Check that multiple languages are configured in `[languages]`
- Ensure `show_language_switcher` is not set to `false`

**Menu items not appearing:**

- Verify `data/{lang}/menu.yaml` files exist
- Check YAML syntax is correct

**Wrong language content:**

- Ensure content is in correct `content/{lang}/` directory
- Check `contentDir` in language configuration

## 🔄 Migration Between Systems

### From Traditional to Data-Driven (Recommended)

1. Copy menu items from hugo.toml to `data/{lang}/menu.yaml` files
2. Remove `[languages.{lang}.menu]` sections from hugo.toml
3. Keep `[languages]` section for language configuration

### From Data-Driven to Traditional

1. Copy menu items from `data/{lang}/menu.yaml` to hugo.toml
2. Add `[languages.{lang}.menu]` sections to hugo.toml
3. Delete `data/{lang}/menu.yaml` files

## 🗂️ File Structure

```
├── hugo.toml                    # Language configuration
├── data/
│   ├── site_config.yaml        # Optional visual enhancements (flags)
│   ├── en/
│   │   ├── menu.yaml           # English menu (data-driven)
│   │   ├── dojo.yaml           # English dojo info
│   │   └── ...
│   ├── pt/
│   │   ├── menu.yaml           # Portuguese menu (data-driven)
│   │   └── ...
├── content/
│   ├── en/                     # English content
│   ├── pt/                     # Portuguese content
│   └── ...
└── layouts/partials/
    ├── site-navigation.html    # Uses data-driven menus
    └── i18nlist.html           # Smart language switcher
```

## ✅ Summary

**Recommended Approach (Data-Driven):**

- ✅ Languages configured manually in hugo.toml
- ✅ Menus in simple YAML files
- ✅ Automatic language switcher behavior
- ✅ Easier to maintain and extend

**Traditional Approach:**

- ⚠️ Everything in hugo.toml (can get repetitive)
- ⚠️ Manual menu management for each language
- ✅ Standard Hugo configuration

# name = "Sobre"

# url = "/pt/about/"

# weight = 1

#

# [[languages.pt.menu.main]]

# name = "Instrutores"

# url = "/pt/instructors/"

# weight = 2

# Uncomment the single-language menu:

[menu]
[[menu.main]]
name = "About"
url = "/about/"
weight = 1

[[menu.main]]
name = "Instructors"
url = "/instructors/"
weight = 2

````

#### Step 2: Hide the Language Switcher

In the `[params]` section, add:

```toml
[params]
  # ... other params ...
  hide_language_switcher = true
````

#### Step 3: Move Content

Move your content from `content/en/` to `content/`:

```bash
mv content/en/* content/
rmdir content/en
rm -rf content/pt  # Remove Portuguese content if not needed
```

### 3. Adding More Languages

To add more languages (e.g., Spanish):

#### Step 1: Add Language Configuration

In `hugo.toml`:

```toml
[languages.es]
  title = "Dojo de Ejemplo"
  weight = 3
  contentDir = "content/es"
  languageName = "Español"
```

#### Step 2: Add Spanish Menu

```toml
[languages.es.menu]
  [[languages.es.menu.main]]
    name = "Acerca de"
    url = "/es/about/"
    weight = 1

  [[languages.es.menu.main]]
    name = "Instructores"
    url = "/es/instructors/"
    weight = 2
```

#### Step 3: Create Content Directory

```bash
mkdir -p content/es
# Copy and translate content files
cp content/en/*.md content/es/
```

## Language Switcher Features

The language switcher dropdown includes:

- 🌐 Globe icon with current language name
- Dropdown menu with all available languages
- Current language marked with ✓
- Hover effects and clean styling
- RTL (right-to-left) language support

## Configuration Parameters

In `hugo.toml` `[params]` section:

```toml
[params]
  # Show/hide language switcher
  show_language_switcher = true    # Shows when multiple languages available
  # OR
  hide_language_switcher = true    # Completely hides the switcher
```

## File Structure

```
├── hugo.toml                 # Main configuration
├── content/
│   ├── en/                   # English content
│   │   ├── _index.md
│   │   ├── about.md
│   │   └── instructors.md
│   └── pt/                   # Portuguese content
│       ├── _index.md
│       ├── about.md
│       └── instructors.md
├── data/
│   ├── en/                   # English data files
│   └── pt/                   # Portuguese data files
└── layouts/
    └── partials/
        └── i18nlist.html     # Custom language switcher
```

## Testing

1. Start Hugo server: `hugo server`
2. Visit `http://localhost:1313/`
3. Test language switching using the dropdown in the navigation
4. Verify URLs:
   - English: `http://localhost:1313/` or `http://localhost:1313/en/`
   - Portuguese: `http://localhost:1313/pt/`

## Troubleshooting

**Problem: Language switcher not showing**

- Check that you have multiple languages configured in `[languages]`
- Ensure `hide_language_switcher` is not set to `true`

**Problem: Wrong language content**

- Verify content is in the correct `content/{lang}/` directory
- Check `contentDir` in language configuration

**Problem: Menu links wrong**

- Ensure menu URLs include language prefix (e.g., `/pt/about/`)
- Check menu configuration in `hugo.toml`
