# Artify Studio Architecture

## Project Overview

Artify Studio is a curated discovery platform for designers.

The website recommends premium creative assets from Creative Fabrica through organized collections.

The goal is not to copy product marketplaces.

The goal is to create the best curated collections, inspiration pages and discovery experience.

---

# Technology Stack

Framework:
Astro

Styling:
Tailwind CSS

Language:
TypeScript

Data:
JSON

Deployment:
Netlify

Architecture:
Static Site Generation

---

# Core Principle

Everything must be generated automatically.

Content → JSON → Astro → Static Pages → Netlify

The website should scale from hundreds to thousands of collections without changing the architecture.

---

# Website Structure

Homepage

↓

Category

↓

Collection

↓

Product Recommendation

---

# Main Categories

## Fonts

Examples:

- Bubble Fonts
- Luxury Fonts
- Retro Fonts
- Handwritten Fonts


## Procreate

Examples:

- Nature Brushes
- Painting Brushes
- Manga Brushes
- Fashion Brushes


## SVG

Examples:

- Cricut SVG
- Monogram SVG
- Wedding SVG
- Halloween SVG

---

# Components

Reusable components:

Header

Footer

ProductCard

CollectionCard

CategoryCard

Search

Button

---

# Content System

All collections are stored as structured data.

Example:

content/fonts/bubble.json

Contains:

- title
- description
- SEO keywords
- affiliate links
- related collections
- images

---

# Pages

Pages are automatically generated.

Examples:

/fonts/bubble-fonts

/procreate/nature-brushes

/svg/cricut-svg

---

# Affiliate System

All external Creative Fabrica links must automatically include:

/ref/8122976/

and campaign tracking:

?campaign=collection_name

---

# SEO Strategy

Important priorities:

Pinterest SEO

Google SEO

Fast loading

Internal linking

Structured metadata

Collection-based keywords

---

# Design Philosophy

Premium creative marketplace feeling.

Inspired by:

- Apple simplicity
- Creative Market
- Pinterest discovery

Requirements:

- Mobile first
- Beautiful cards
- Large typography
- Smooth animations
- Clean spacing
- Fast performance

---

# Future Scalability

The architecture must support:

100 collections

1000 collections

10000+ products

without rewriting the codebase.