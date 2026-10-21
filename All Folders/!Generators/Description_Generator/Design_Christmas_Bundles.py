import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🎁 Discover massive Christmas bundles packed with festive joy.",
    "🎄 Everything you need for holiday crafting in one giant bundle.",
    "✨ Unlock endless creativity with premium winter design bundles.",
    "🎅 Huge holiday collections for all your festive projects.",
    "❄️ Value-packed Christmas bundles to supercharge your designs.",
    "🌟 Explore ultimate holiday packs filled with graphics and fonts.",
    "🎁 Your all-in-one solution for seasonal creativity.",
    "🎄 Unbeatable Christmas bundles for crafters and designers.",
    "✨ The ultimate festive collection is here just in time for the holidays.",
    "🎅 Get more for less with massive winter design bundles.",
    "❄️ Discover treasure troves of Christmas graphics and elements.",
    "🌟 Mega bundles crafted for endless holiday inspiration.",
    "🎁 Big savings on premium Christmas design assets.",
    "🎄 Fill your creative toolkit with giant holiday bundles.",
    "✨ Exceptional value meets festive magic in these bundles.",
    "🎅 All the Christmas cheer you need in one creative package.",
    "❄️ Huge assortments of winter graphics for your best projects.",
    "🌟 Unlock premium holiday collections and start designing.",
    "🎁 The biggest Christmas bundles for your festive creations.",
    "🎄 Discover the ultimate winter design arsenal today."
]

# ==== PROJECT TYPES ====
project_types = [
    "holiday crafts", "festive apparel", "winter decor", "seasonal branding",
    "Christmas cards", "holiday invitations", "festive packaging", "gift tags",
    "seasonal marketing", "holiday printables", "Christmas ornaments", "social media graphics",
    "festive merchandise", "winter scrapbooking", "holiday party supplies", "seasonal websites",
    "Christmas newsletters", "holiday stationery", "festive banners", "winter promotions",
    "Christmas apparel", "holiday mugs", "festive stickers", "winter posters"
]

# ==== CONTENT TYPES ====
content_types = [
    "massive bundle collections", "ultimate holiday packs", "festive design bundles",
    "premium winter assets", "all-in-one Christmas collections", "huge graphic packs",
    "seasonal mega bundles", "curated holiday bundles", "value-packed design kits",
    "festive creative packs", "Christmas bundle inspiration", "winter design packages",
    "ultimate festive toolkits", "massive holiday assortments", "premium bundle resources",
    "huge winter collections", "all-inclusive holiday kits", "festive asset bundles",
    "Christmas design bundles", "winter mega packs"
]

# ==== STYLES ====
styles = [
    "massive", "value-packed", "comprehensive", "festive", "joyful", "merry",
    "premium", "ultimate", "curated", "all-inclusive", "vibrant", "cheerful",
    "magical", "cozy", "wintery", "seasonal", "creative", "versatile",
    "high-quality", "essential"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Grab your massive Christmas bundle today! 🎁",
    "Save big on ultimate holiday collections. ✨",
    "Unlock endless festive creativity now. 🎄",
    "Start crafting with these huge winter bundles. 🎅",
    "Get your all-in-one holiday kit today. ❄️",
    "Don't miss out on these festive savings. 🌟",
    "Your ultimate Christmas toolkit awaits. 🎁",
    "Download the perfect holiday bundle now. 🎄",
    "Supercharge your seasonal designs today. ✨",
    "Everything you need for a creative Christmas. 🎅",
    "Save time and money with mega winter bundles. ❄️",
    "Explore the biggest festive packs of the season. 🌟",
    "Get creative with ultimate holiday bundles. 🎁",
    "Your one-stop shop for Christmas design. 🎄",
    "Unwrap your massive creative bundle today. ✨"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    project1, project2 = random.sample(project_types, 2)
    content = random.choice(content_types)
    style1, style2 = random.sample(styles, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Discover {style1} and {style2} assets crafted for {project1} and {project2}. Explore {content}. {closing}",
        f"{intro} Everything you need for {project1} and {project2}, featuring {style1} and {style2} elements. Enjoy {content}. {closing}",
        f"{intro} Handpicked {style1} and {style2} collections designed for {project1} and {project2}. Find {content}. {closing}",
        f"{intro} Explore {content} blending {style1} and {style2} vibes for {project1} and {project2}. {closing}",
        f"{intro} Perfect for {project1}, {project2}, and more. Discover {style1} {content}. {closing}",
        f"{intro} Curated {style1} bundles with {style2} details, perfect for {project1} and {project2}. {closing}",
        f"{intro} Elevate {project1} and {project2} using {style1} and {style2} assets. Browse {content}. {closing}",
        f"{intro} Huge collections inspired by {style1} and {style2} themes for {project1} and {project2}. {closing}"
    ]

    return random.choice(templates)

if __name__ == "__main__":
    print(generate_description())
