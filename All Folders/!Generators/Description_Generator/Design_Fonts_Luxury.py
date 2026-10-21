import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "💎 Discover timeless luxury typography for sophisticated designs.",
    "✨ Elegant fonts crafted for premium branding and refined creativity.",
    "👑 Luxury typefaces designed to elevate every visual identity.",
    "💫 Explore premium fonts with elegance and timeless beauty.",
    "🥂 Sophisticated typography for brands that stand out.",
    "🌟 Curated luxury fonts for designers with exceptional taste.",
    "💎 Where elegance meets unforgettable typography.",
    "✨ Premium lettering inspiration for refined creative projects.",
    "👑 Beautiful luxury fonts for modern and timeless designs.",
    "🌿 Discover fonts that express class, elegance, and sophistication.",
    "💍 Luxury typography for premium brands and stylish creations.",
    "🖋️ Refined fonts inspired by elegance and exclusivity.",
    "💖 Premium typefaces that bring luxury into every design.",
    "🌟 Elevate your branding with elegant typography inspiration.",
    "✨ Discover beautiful fonts with timeless appeal.",
    "💎 Handpicked luxury fonts for creative professionals.",
    "👑 Exclusive typography ideas for premium design projects.",
    "🥂 Sophisticated lettering crafted for modern luxury.",
    "🌸 Elegant fonts designed to leave a lasting impression.",
    "💫 Premium typography that speaks with confidence."
]

# ==== PROJECT TYPES ====
project_types = [
    "luxury branding",
    "fashion brands",
    "boutique businesses",
    "beauty brands",
    "cosmetics packaging",
    "perfume branding",
    "jewelry brands",
    "high-end logos",
    "premium packaging",
    "wedding stationery",
    "editorial design",
    "luxury invitations",
    "branding identities",
    "fine dining menus",
    "hotel branding",
    "spa branding",
    "interior design studios",
    "creative portfolios",
    "product packaging",
    "social media branding",
    "premium websites",
    "business cards",
    "magazine layouts",
    "book covers",
    "signature logos",
    "luxury marketing",
    "exclusive collections",
    "designer presentations",
    "visual identities",
    "premium print design"
]

# ==== CONTENT TYPES ====
content_types = [
    "luxury font inspiration",
    "premium typography ideas",
    "curated luxury collections",
    "exclusive font showcases",
    "elegant lettering inspiration",
    "high-end design resources",
    "premium branding ideas",
    "professional typography tips",
    "luxury design inspiration",
    "timeless font collections",
    "beautiful typeface showcases",
    "exclusive typography trends",
    "creative branding inspiration",
    "premium font discoveries",
    "designer recommendations",
    "refined typography ideas",
    "luxury visual inspiration",
    "signature font collections",
    "carefully selected typefaces",
    "exclusive creative inspiration"
]

# ==== LUXURY STYLES ====
styles = [
    "luxurious",
    "elegant",
    "timeless",
    "refined",
    "premium",
    "sophisticated",
    "classic",
    "minimal",
    "graceful",
    "high-end",
    "exclusive",
    "polished",
    "prestigious",
    "modern luxury",
    "editorial",
    "fashion-forward",
    "stylish",
    "iconic",
    "signature",
    "artistic",
    "beautiful",
    "refined serif",
    "sleek",
    "contemporary",
    "delicate",
    "ornamental",
    "luxury-inspired",
    "designer",
    "upscale",
    "elevated"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Follow for daily luxury typography inspiration. ✨",
    "Save your favorite premium font ideas. 💎",
    "Discover elegant fonts for every luxury brand. 👑",
    "Elevate your creative vision with timeless typography. 🌟",
    "Find your next signature font today. 🖋️",
    "Luxury begins with exceptional typography. 💫",
    "Create unforgettable branding with elegant fonts. 🥂",
    "Explore premium typefaces you'll love. 💖",
    "Discover typography crafted for sophisticated designers. ✨",
    "Where elegance inspires every design. 👑",
    "Timeless fonts for timeless brands. 💎",
    "Bring luxury into every creative project. 🌿",
    "Beautiful typography starts here. ✨",
    "Follow for exclusive font inspiration. 💍",
    "Design with confidence and sophistication. 🌟"
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

        f"{intro} Elegant typography for {project1} and {project2}, featuring {style1} and {style2} aesthetics. Enjoy {content}. {closing}",

        f"{intro} Handpicked {style1} and {style2} typefaces designed for {project1} and {project2}. Find {content}. {closing}",

        f"{intro} Explore premium typography blending {style1} and {style2} elegance for {project1} and {project2}. {content}. {closing}",

        f"{intro} Beautiful luxury fonts for {project1}, {project2}, and sophisticated branding. Discover {content}. {closing}",

        f"{intro} Curated {style1} typography with {style2} details, perfect for {project1} and {project2}. {closing}",

        f"{intro} Elevate {project1} and {project2} using {style1} and {style2} fonts. Browse {content}. {closing}",

        f"{intro} Exclusive fonts inspired by {style1} elegance and {style2} refinement for {project1} and {project2}. {closing}"
    ]

    return random.choice(templates)

# ==== TEST ====
if __name__ == "__main__":
    print(generate_description())