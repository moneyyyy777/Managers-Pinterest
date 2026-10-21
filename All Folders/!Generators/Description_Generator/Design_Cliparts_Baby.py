import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🍼 Discover a world of adorable baby clipart and creative design resources.",
    "✨ Explore beautiful baby graphics, illustrations, and digital artwork for every idea.",
    "🌸 A creative collection of baby clipart and visual resources for makers and designers.",
    "🎨 Discover cute baby-themed graphics made to inspire creative projects.",
    "🧸 Your source for adorable baby clipart, PNG graphics, and design inspiration.",
    "💖 Explore charming baby illustrations and creative resources for every project.",
    "🌿 Discover beautiful baby artwork and digital graphics for creative makers.",
    "🎀 A place for baby clipart, illustrations, and playful design ideas.",
    "✨ Explore adorable graphics created for baby-themed creative projects.",
    "🍼 Beautiful baby clipart and digital elements for modern creative projects.",
    "🌈 Inspiring baby graphics and illustrations for creators of every kind.",
    "🎨 Discover fresh baby clipart ideas, PNG graphics, and creative inspiration.",
    "🚀 Creative baby graphics that help bring every project to life.",
    "📚 Explore a growing collection of baby clipart and design resources.",
    "💖 Beautiful baby-themed artwork for every creative journey.",
    "🌟 Your daily source of baby clipart and children's design inspiration.",
    "🧸 Discover playful baby illustrations, graphics, and creative elements.",
    "💫 Unlock creative possibilities with adorable baby clipart and digital artwork.",
    "🎨 A place where baby-inspired artwork meets creativity and design.",
    "✨ Curated baby clipart and graphics for every creative project.",
    "🍼 Creative baby illustrations for makers, designers, and craft lovers.",
    "📖 Explore baby graphics and visual resources for creative projects.",
    "💎 Discover beautiful baby-themed digital artwork and design elements.",
    "🌸 Explore creative baby graphics from soft and sweet to playful and fun.",
    "🎯 Helping creatives discover inspiring baby clipart every day.",
    "🚀 Discover baby illustrations and graphics that make creative projects special.",
    "🧸 Creative baby clipart and digital elements for makers and designers.",
    "🎨 Your inspiration hub for baby graphics, illustrations, and PNG resources.",
    "✨ Explore adorable baby artwork and endless creative possibilities.",
    "🌟 Endless inspiration for baby-themed designs and creative projects."
]

# ==== PROJECT TYPES ====
project_types = [
    "baby projects",
    "baby-themed projects",
    "creative projects",
    "baby shower projects",
    "nursery projects",
    "nursery decor",
    "baby party projects",
    "kids projects",
    "children's projects",
    "newborn projects",
    "birthday projects",
    "party designs",
    "party decorations",
    "invitations",
    "baby invitations",
    "baby shower invitations",
    "nursery designs",
    "nursery artwork",
    "printable projects",
    "digital designs",
    "print projects",
    "craft projects",
    "DIY creations",
    "scrapbooking",
    "paper crafts",
    "stationery projects",
    "greeting cards",
    "decorative projects",
    "social media designs",
    "creative branding",
    "small business projects",
    "handmade projects",
    "gift projects",
    "party stationery",
    "event designs",
    "children's crafts",
    "creative collections",
    "visual projects",
    "content creation",
    "maker projects"
]

# ==== CONTENT TYPES ====
content_types = [
    "baby clipart",
    "baby graphics",
    "baby illustrations",
    "baby PNG graphics",
    "baby PNG images",
    "baby digital artwork",
    "baby design resources",
    "baby creative resources",
    "baby clipart collections",
    "baby graphic collections",
    "baby illustration collections",
    "baby artwork",
    "baby-themed graphics",
    "baby-themed illustrations",
    "baby digital graphics",
    "baby design elements",
    "baby visual elements",
    "baby creative elements",
    "baby printable graphics",
    "baby printable artwork",
    "baby graphic resources",
    "baby illustration resources",
    "baby clipart resources",
    "baby design inspiration",
    "baby visual inspiration",
    "baby creative inspiration",
    "children's clipart",
    "children's graphics",
    "children's illustrations",
    "kids clipart",
    "kids graphics",
    "kids illustrations",
    "newborn graphics",
    "newborn illustrations",
    "baby-themed artwork",
    "baby creative assets",
    "baby visual resources",
    "adorable baby graphics",
    "cute baby illustrations",
    "baby artwork collections"
]

# ==== STYLES ====
styles = [
    "cute",
    "adorable",
    "playful",
    "sweet",
    "charming",
    "whimsical",
    "soft",
    "gentle",
    "delicate",
    "colorful",
    "pastel",
    "modern",
    "minimal",
    "elegant",
    "simple",
    "fun",
    "cheerful",
    "friendly",
    "dreamy",
    "cozy",
    "adorable",
    "child-friendly",
    "playful",
    "creative",
    "artistic",
    "beautiful",
    "lovely",
    "fresh",
    "joyful",
    "warm",
    "soft-toned",
    "aesthetic",
    "expressive",
    "imaginative",
    "unique",
    "versatile",
    "eye-catching",
    "inspiring",
    "decorative",
    "sweet"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Follow for fresh baby clipart inspiration every day. 🍼",
    "Save your favorite graphics and keep creating. ✨",
    "Discover new baby design ideas for your next project. 🎨",
    "Find adorable graphics with every visit. 🧸",
    "Your next favorite baby clipart is waiting here. 💖",
    "Keep exploring, creating, and inspiring. 🌸",
    "Find inspiration for every baby-themed project. 🎀",
    "Bring adorable baby graphics into your next design. 🍼",
    "Turn creative ideas into beautiful baby-themed designs. ❤️",
    "Explore more baby clipart and endless inspiration. 📚",
    "Your creative baby design journey starts here. ✨",
    "Save, create, repeat. 🧸",
    "Inspiration is always one adorable graphic away. 🌈",
    "Create something sweet and memorable today. 🎨",
    "Discover baby clipart you'll want to save. 📌",
    "Find baby design resources for every creative vision. 💎",
    "Keep your creativity flowing with fresh baby artwork. 🌟",
    "Explore, create, inspire. ❤️",
    "Beautiful baby design inspiration begins here. ✨",
    "Make every baby-themed project a little more special. 🍼"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    project1, project2 = random.sample(project_types, 2)
    content = random.choice(content_types)
    style1, style2 = random.sample(styles, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Explore {style1} and {style2} {content}, perfect for {project1} or {project2}. {closing}",

        f"{intro} Discover {content} with a {style1} and {style2} feel, created for {project1} and {project2}. {closing}",

        f"{intro} Your source for {content} for {project1} and {project2}. Featuring beautiful {style1} and {style2} graphics to inspire your creativity. {closing}",

        f"{intro} Explore {style1} and {style2} baby graphics, ideal for {project1} as well as {project2}. Discover fresh {content} every day. {closing}",

        f"{intro} Beautiful {style1} and {style2} baby artwork curated for {project1} and {project2}. Explore inspiring {content} and elevate your creative work. {closing}",

        f"{intro} Explore {content} built around {style1} and {style2} styles. Perfect for {project1} or {project2}. {closing}",

        f"{intro} Handpicked {style1} and {style2} baby clipart, illustrations, and graphics for {project1} & {project2}, plus {content} to keep you inspired. {closing}"
    ]

    return random.choice(templates)


# ==== RUN TEST IF FILE EXECUTED DIRECTLY ====
if __name__ == "__main__":
    print(generate_description())