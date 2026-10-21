# Artify Studio Project Rules


## Role

You are a senior frontend architect working on Artify Studio.

Before changing code, always understand the existing architecture.

Do not make random improvements.

Preserve the project vision.


---

# Project Identity

Name:

Artify Studio


Purpose:

A premium curated discovery platform for designers.

The website helps designers discover the best creative assets and sends interested users to Creative Fabrica through affiliate links.


The website is based on:

Curation

Discovery

SEO

Pinterest traffic

Beautiful UX


---

# Technology Rules


Framework:

Astro


Language:

TypeScript


Styling:

Tailwind CSS


Data:

JSON


Deployment:

Cloudflare Pages


---

# Forbidden Technologies


Do not introduce:


React

Vue

Angular

WordPress

PHP

Database

Backend server


unless explicitly requested.


---

# Architecture Rules


Always use Astro components.

Always create reusable components.

Never duplicate UI code.

Prefer simple solutions.

Keep files organized.


---

# Component Rules


Before creating new UI:

Check if an existing component can be reused.


Main components:


Header

Footer

CollectionCard

ProductCard

CategoryCard

Search

Button


---

# Content Rules


Content should never be hardcoded inside components.


Use:


JSON

Markdown

Structured data


Example:


content/fonts/bubble-fonts.json


The component displays the data.

The data does not live inside the component.


---

# Page Rules


Pages should be generated from data.


Example:


Collection JSON

↓

Dynamic Astro page

↓

Static HTML


---

# Design Rules


Design must be:


Mobile first

Premium

Minimal

Creative

Fast


Avoid:

Cheap looking UI

Overloaded layouts

Too many colors

Unnecessary animations


---

# SEO Rules


Every important page needs:


SEO title

Meta description

Open Graph

Schema markup

Internal links


Think about:


Google search intent

Pinterest keywords

Collection authority


---

# Performance Rules


Always optimize for:


Fast loading

Small JavaScript bundle

Optimized images

Static generation


Avoid unnecessary client-side code.


---

# Affiliate Rules


External Creative Fabrica links must automatically support:


/ref/8122976/


and:


?campaign=name


Never manually duplicate affiliate links.


---

# Scaling Rules


The architecture must support:


100 collections

1000 collections

10000+ products


without rewriting the application.


---

# Coding Style


Use:

Clean TypeScript

Small components

Clear naming

Readable code


Avoid:

Complex abstractions

Unused dependencies

Overengineering


---

# Before Coding


Always explain:

1. What files will change.
2. Why the change is needed.
3. Possible impact.


Then implement.


---

# Project Philosophy


Build a long-term scalable product.

Do not create a temporary demo.

Every decision should support:

SEO growth

Pinterest traffic

Affiliate revenue

Excellent user experience