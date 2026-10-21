import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🎄 Discover magical Christmas typography for festive designs.",
    "✨ Elegant holiday fonts crafted for seasonal branding and joy.",
    "🎅 Festive typefaces designed to elevate your winter projects.",
    "❄️ Explore cozy fonts with a warm and joyful holiday feel.",
    "🌟 Cheerful typography for Christmas cards and beyond.",
    "🎁 Curated holiday fonts for designers and crafters.",
    "🎄 Where winter magic meets beautiful typography.",
    "✨ Premium lettering inspiration for your Christmas creations.",
    "🎅 Joyful holiday fonts for modern and traditional designs.",
    "❄️ Discover fonts that express the spirit of the season.",
    "🌟 Festive typography for merry branding and stylish crafts.",
    "🎁 Beautiful script fonts inspired by Christmas elegance.",
    "🎄 Holiday typefaces that bring cheer into every design.",
    "✨ Elevate your seasonal projects with stunning typography.",
    "🎅 Discover magical fonts with a timeless winter appeal.",
    "❄️ Handpicked Christmas fonts for creative professionals.",
    "🌟 Exclusive lettering ideas for premium holiday designs.",
    "🎁 Sophisticated winter fonts crafted for modern projects.",
    "🎄 Joyful fonts designed to leave a festive impression.",
    "✨ Holiday typography that speaks with warmth and cheer."
]

# ==== PROJECT TYPES ====
project_types = [
    "Christmas cards", "holiday invitations", "festive branding", "winter apparel",
    "seasonal packaging", "holiday newsletters", "Christmas ornaments", "gift tags",
    "festive social media", "winter typography projects", "holiday merchandise",
    "Christmas party supplies", "seasonal logos", "festive banners", "holiday menus",
    "winter lookbooks", "Christmas quotes", "festive typography art", "holiday signs",
    "seasonal editorial design", "Christmas book covers", "holiday marketing",
    "festive web design", "winter craft projects", "Christmas typography bundles"
]

# ==== CONTENT TYPES ====
content_types = [
    "Christmas font inspiration", "holiday typography ideas", "festive font collections",
    "cozy lettering inspiration", "winter typeface showcases", "seasonal design resources",
    "joyful branding ideas", "holiday typography tips", "festive design inspiration",
    "magical font collections", "beautiful Christmas typefaces", "winter lettering trends",
    "festive branding inspiration", "holiday font discoveries", "designer typography recommendations",
    "cheerful lettering ideas", "Christmas visual inspiration", "holiday script collections",
    "carefully selected winter fonts", "exclusive festive inspiration"
]

# ==== STYLES ====
styles = [
    "festive", "magical", "cozy", "joyful", "merry", "elegant", "hand-lettered",
    "calligraphic", "whimsical", "traditional", "modern holiday", "playful",
    "script", "serif", "quirky", "warm", "cheerful", "stylish", "bold", "delicate",
    "rustic", "vintage", "decorative", "snowy"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Follow for daily Christmas typography inspiration. ✨",
    "Save your favorite holiday font ideas. 🎄",
    "Discover magical fonts for every festive project. 🎅",
    "Elevate your winter designs with joyful typography. 🌟",
    "Find your next holiday script font today. 🎁",
    "Christmas magic begins with beautiful typography. ❄️",
    "Create unforgettable holiday cards with festive fonts. ✨",
    "Explore winter typefaces you'll love. 🎄",
    "Discover typography crafted for cozy designers. 🎅",
    "Where holiday cheer inspires every design. 🌟",
    "Magical fonts for a merry season. 🎁",
    "Bring festive joy into every creative project. ❄️",
    "Beautiful winter lettering starts here. ✨",
    "Follow for exclusive holiday font inspiration. 🎄",
    "Design with warmth and Christmas cheer. 🎅"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    project1, project2 = random.sample(project_types, 2)
    content = random.choice(content_types)
    style1, style2 = random.sample(styles, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Discover {style1} and {style2} fonts crafted for {project1} and {project2}. Explore {content}. {closing}",
        f"{intro} Magical typography for {project1} and {project2}, featuring {style1} and {style2} aesthetics. Enjoy {content}. {closing}",
        f"{intro} Handpicked {style1} and {style2} typefaces designed for {project1} and {project2}. Find {content}. {closing}",
        f"{intro} Explore festive typography blending {style1} and {style2} charm for {project1} and {project2}. {content}. {closing}",
        f"{intro} Beautiful Christmas fonts for {project1}, {project2}, and seasonal branding. Discover {content}. {closing}",
        f"{intro} Curated {style1} typography with {style2} details, perfect for {project1} and {project2}. {closing}",
        f"{intro} Elevate {project1} and {project2} using {style1} and {style2} fonts. Browse {content}. {closing}",
        f"{intro} Joyful fonts inspired by {style1} vibes and {style2} cheer for {project1} and {project2}. {closing}"
    ]

    return random.choice(templates)

if __name__ == "__main__":
    print(generate_description())
