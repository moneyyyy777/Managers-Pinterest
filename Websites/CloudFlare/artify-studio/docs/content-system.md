# Artify Studio Content System


## Main Idea

The website is generated from structured content.

The developer should not manually create every page.


Content

↓

JSON

↓

Astro Components

↓

Static Pages


---

# Collection Structure


Example:


content/fonts/bubble-fonts.json


Contains:


title

slug

category

description

keywords

products

relatedCollections


---

# Product Structure


Example:


{
"title": "",
"url": "",
"image": "",
"tags": []
}


---

# Affiliate System


Every Creative Fabrica URL must automatically transform into:


original-url/ref/8122976/


Campaign tracking:


?campaign=collection_name


---

# Collection Types


Fonts

Examples:

Bubble Fonts

Luxury Fonts

Vintage Fonts


Procreate

Examples:

Nature Brushes

Painting Brushes

Manga Brushes


SVG

Examples:

Cricut SVG

Wedding SVG

Halloween SVG


---

# Related Content


Every collection should have:

Related collections

Popular collections

Similar products


This creates internal linking.


---

# Scalability


The system should support:

10000+ products

without changing components.

