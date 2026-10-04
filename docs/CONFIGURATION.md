# Configuration Guide

Complete reference for all YAML configuration files. These files control your dojo website's content and appearance.

## Overview

All configuration files are located in `/data/en/` (for English) and `/data/pt/` (for Portuguese). The template uses YAML format for easy editing.

## File Structure

```
data/
├── en/                     # English configuration
│   ├── dojo.yaml          # Basic dojo information
│   ├── instructors.yaml   # Instructor list and ranks
│   ├── schedule.yaml      # Class schedule
│   ├── social.yaml        # Social media links
│   └── dojo-history.yaml  # Optional: Custom dojo history
└── pt/                     # Portuguese configuration
    └── [same files as en/]
```

## Configuration Files

### 1. dojo.yaml - Basic Dojo Information

This file contains your dojo's essential information.

```yaml
# Your dojo's name (appears on homepage and titles)
dojo_name: "Sakura Goju-Ryu Dojo"

# Full address for contact page
address: |
  123 Karate Way
  San Francisco, CA 94102
  United States

# Contact information
email: "info@sakuragojuryu.com"
phone: "+1 (415) 555-0123"

# Optional: OpenStreetMap embed URL for interactive map
# Get this from openstreetmap.org by searching your address
# and clicking "Share" -> "Embed HTML"
map_embed_url: "https://www.openstreetmap.org/export/embed.html?bbox=-122.4207,37.7749,-122.4107,37.7849&layer=mapnik&marker=37.7799,-122.4157"

# Optional: Website URL (if you have a custom domain)
website: "https://yourdojo.com"

# Optional: Training philosophy or brief description
description: |
  A traditional Goju-Ryu karate dojo dedicated to preserving authentic
  Okinawan martial arts. We are proud members of the International
  Okinawan Goju-Ryu Karate-do Federation (IOGKF).
```

#### Required Fields
- `dojo_name`: Your dojo's name
- `address`: Physical address
- `email`: Contact email
- `phone`: Contact phone number

#### Optional Fields
- `map_embed_url`: Interactive map (highly recommended)
- `website`: Custom domain if you have one
- `description`: Brief description for homepage

### 2. instructors.yaml - Instructor Information

List your certified instructors with their ranks.

```yaml
# List of instructors at your dojo
instructors:
  - name: "John Smith"
    dan: "7th Dan"
    title: "Chief Instructor"
    bio: "Sensei Smith has been practicing Goju-Ryu for over 30 years..."
    
  - name: "Maria Santos"
    dan: "4th Dan"
    title: "Senior Instructor"
    bio: "Sensei Santos specializes in kata and self-defense..."
    
  - name: "David Wilson"
    dan: "2nd Dan"
    title: "Assistant Instructor"
    bio: "Sensei Wilson focuses on youth programs..."
```

#### Field Explanations
- `name`: Instructor's full name
- `dan`: Rank (e.g., "1st Dan", "Shodan", "Kyudansha")
- `title`: Role at the dojo (optional)
- `bio`: Brief biography (optional)

#### Notes
- List instructors in order of seniority
- If no instructors are configured, the page won't appear in navigation
- Support for photos coming in future versions

### 3. schedule.yaml - Class Schedule

Configure your training schedule.

```yaml
# Weekly class schedule
schedule:
  - day: "Monday"
    time: "7:00 PM - 8:30 PM"
    type: "Adult Classes"
    description: "Beginner to Advanced"
    
  - day: "Tuesday"
    time: "6:00 PM - 7:00 PM"
    type: "Youth Classes"
    description: "Ages 8-16"
    
  - day: "Wednesday"
    time: "7:00 PM - 8:30 PM"
    type: "Adult Classes"
    description: "Intermediate to Advanced"
    
  - day: "Thursday"
    time: "6:00 PM - 7:00 PM"
    type: "Youth Classes"
    description: "Ages 8-16"
    
  - day: "Saturday"
    time: "10:00 AM - 12:00 PM"
    type: "Open Training"
    description: "All levels welcome"

# Optional: Special notes about schedule
notes: |
  Private lessons available by appointment.
  Please arrive 15 minutes early for warm-up.
  No classes on IOGKF holidays.
```

#### Field Explanations
- `day`: Day of the week
- `time`: Class time range
- `type`: Type of class (Adult, Youth, Open Training, etc.)
- `description`: Additional details (optional)
- `notes`: General schedule notes (optional)

### 4. social.yaml - Social Media Links

Connect your social media accounts.

```yaml
# Social media links (only include platforms you use)
social:
  facebook: "https://facebook.com/yourdojo"
  instagram: "https://instagram.com/yourdojo"
  youtube: "https://youtube.com/c/yourdojo"
  twitter: "https://twitter.com/yourdojo"
  tiktok: "https://tiktok.com/@yourdojo"
  
# Optional: Display social links in header/footer
show_in_header: true
show_in_footer: true
```

#### Supported Platforms
- `facebook`
- `instagram`
- `youtube`
- `twitter`
- `tiktok`
- `linkedin`

#### Notes
- Only include platforms you actively use
- Links will only appear if configured
- Icons are automatically provided

### 5. dojo-history.yaml - Custom Dojo History (Optional)

Add your dojo's unique story and history.

```yaml
# Enable dojo history page
enabled: true

# Page title
title: "Our Dojo History"

# Page content (supports Markdown formatting)
content: |
  ## Foundation
  
  Sakura Dojo was founded in 1995 by Sensei John Smith after his return
  from training in Okinawa with the IOGKF masters.
  
  ## Early Years
  
  Starting with just 5 students in a community center, our dojo has grown
  to serve over 100 students of all ages.
  
  ## IOGKF Affiliation
  
  We became officially affiliated with the IOGKF in 1998, connecting us
  to the global family of traditional Goju-Ryu practitioners.
  
  ## Today
  
  Today, we continue to preserve and teach authentic Okinawan Goju-Ryu
  Karate while building a strong community of martial artists.

# Optional: Timeline of important events
timeline:
  - year: "1995"
    event: "Dojo founded"
  - year: "1998"
    event: "IOGKF affiliation"
  - year: "2005"
    event: "Moved to current location"
  - year: "2020"
    event: "Added online training programs"
```

#### When to Use
- Your dojo has a unique founding story
- You want to highlight special achievements
- You have historical photos or documentation
- You want to build deeper connection with students

#### Notes
- This page is completely optional
- If `enabled: false` or file doesn't exist, page won't appear
- Supports Markdown for rich text formatting

## Optional Analytics

Google Analytics is configured globally in `hugo.toml`, not in language-specific YAML content. It is disabled by default. See the [Analytics Setup guide](ANALYTICS.md) for creating a dojo-specific GA4 property, enabling it with a Measurement ID, and understanding visitor consent.

## Multi-language Configuration

### Adding Portuguese Content

Create identical files in `/data/pt/` with Portuguese translations:

```yaml
# data/pt/dojo.yaml
dojo_name: "Dojo Sakura Goju-Ryu"
address: |
  Rua do Karatê, 123
  São Paulo, SP 01234-567
  Brasil
email: "info@sakuragojuryu.com.br"
phone: "+55 (11) 5555-0123"
```

### Adding Other Languages

1. Create new language folder: `/data/es/` (for Spanish)
2. Copy all YAML files and translate content
3. Update `hugo.toml` to include the new language
4. Create content pages in `/content/es/`

## Validation and Testing

### YAML Syntax Check

Use online validators to check your YAML:
- [YAML Lint](https://www.yamllint.com/)
- [Online YAML Parser](https://yaml-online-parser.appspot.com/)

### Common Mistakes

1. **Indentation**: YAML is sensitive to spaces
   ```yaml
   # ❌ Wrong
   instructors:
   - name: "John"
   
   # ✅ Correct
   instructors:
     - name: "John"
   ```

2. **Quotes**: Use quotes for strings with special characters
   ```yaml
   # ❌ Wrong
   description: This has: special characters
   
   # ✅ Correct
   description: "This has: special characters"
   ```

3. **Multiline Text**: Use `|` for multiple lines
   ```yaml
   # ✅ Correct
   address: |
     123 Main Street
     City, State 12345
     Country
   ```

### Testing Changes

After making changes:

1. **Local Testing**:
   ```bash
   hugo server
   ```
   
2. **Build Test**:
   ```bash
   hugo --gc --minify
   ```

3. **Check for Errors**: Look for YAML parsing errors in terminal output

## Best Practices

### Content Guidelines

1. **Keep It Current**: Update schedules and instructor information regularly
2. **Be Accurate**: Double-check contact information and addresses
3. **Professional Tone**: Use respectful, martial arts-appropriate language
4. **Consistent Formatting**: Use the same format for ranks, times, etc.

### Maintenance

1. **Regular Reviews**: Check all information quarterly
2. **Backup**: Keep backups of your customized YAML files
3. **Version Control**: Use Git to track changes
4. **Testing**: Test after every significant change

---

**Pro Tip**: Start with minimal information and add details gradually. It's better to have accurate basic information than incomplete detailed information.
