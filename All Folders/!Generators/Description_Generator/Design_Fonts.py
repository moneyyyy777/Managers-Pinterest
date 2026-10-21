import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🎨 Discover a world where typography inspires every creative idea.",
    "✨ Beautiful fonts for every project, mood, and creative vision.",
    "🌟 Explore typography designed to spark imagination.",
    "💎 A curated collection of inspiring fonts and design ideas.",
    "📌 Typography inspiration for creators, makers, and dreamers.",
    "🔥 Find fonts that transform simple words into memorable designs.",
    "💡 Every letter tells a story—discover yours here.",
    "🎯 Your destination for creative typography inspiration.",
    "🖋️ Explore unique letterforms crafted for modern creativity.",
    "🎨 Fonts that elevate every design with personality and style.",
    "✨ Inspiring typography for creators of every skill level.",
    "🌈 Discover fresh ideas for beautiful lettering and type design.",
    "🚀 Creative fonts that bring every project to life.",
    "📚 Explore endless typography inspiration in one place.",
    "💖 Design begins with the perfect font.",
    "🌟 Your daily dose of typography inspiration.",
    "🎭 Every font has its own personality—find your favorite.",
    "💫 Unlock endless creative possibilities with inspiring typefaces.",
    "🖌️ A place where typography meets imagination.",
    "🎨 Curated fonts for every creative journey.",
    "✨ Creativity starts with beautiful typography.",
    "📖 Explore fonts that fit every design direction.",
    "💎 Premium inspiration for every lettering style.",
    "🌍 Typography ideas from timeless classics to modern trends.",
    "🎯 Helping creatives find the perfect font every day.",
    "🚀 Discover fonts that inspire unforgettable designs.",
    "🖋️ Lettering ideas for every creative project.",
    "🎨 Your typography inspiration starts here.",
    "✨ Explore beautiful fonts without limits.",
    "🌟 Endless inspiration for typography lovers."
]

# ==== PROJECT TYPES ====
project_types = [
    "creative projects",
    "branding",
    "logos",
    "visual identities",
    "social media",
    "print design",
    "digital design",
    "marketing materials",
    "editorial layouts",
    "posters",
    "packaging",
    "web design",
    "mobile apps",
    "presentations",
    "merchandise",
    "business materials",
    "invitations",
    "greeting cards",
    "craft projects",
    "DIY creations",
    "scrapbooking",
    "journals",
    "stickers",
    "labels",
    "product design",
    "book covers",
    "magazines",
    "creative branding",
    "digital artwork",
    "content creation",
    "templates",
    "creative assets",
    "personal projects",
    "professional designs",
    "visual storytelling",
    "decorative layouts",
    "creative compositions",
    "artistic concepts",
    "modern graphics",
    "everyday design"
]

# ==== CONTENT TYPES ====
content_types = [
    "font inspiration",
    "typography ideas",
    "creative collections",
    "design inspiration",
    "curated selections",
    "visual inspiration",
    "creative tips",
    "expert recommendations",
    "design resources",
    "font showcases",
    "creative discoveries",
    "trend updates",
    "style inspiration",
    "design ideas",
    "typography collections",
    "creative examples",
    "design guides",
    "creative insights",
    "handpicked fonts",
    "fresh inspiration",
    "visual references",
    "creative concepts",
    "daily inspiration",
    "lettering ideas",
    "font highlights",
    "design showcases",
    "creative solutions",
    "beautiful typography",
    "professional inspiration",
    "design inspiration for every style"
]

# ==== STYLES ====
styles = [
    "timeless",
    "modern",
    "creative",
    "expressive",
    "minimal",
    "playful",
    "elegant",
    "bold",
    "clean",
    "artistic",
    "refined",
    "stylish",
    "distinctive",
    "eye-catching",
    "professional",
    "premium",
    "versatile",
    "unique",
    "dynamic",
    "inspiring",
    "decorative",
    "sophisticated",
    "balanced",
    "creative-driven",
    "expressive",
    "imaginative",
    "contemporary",
    "original",
    "polished",
    "aesthetic",
    "impactful",
    "memorable",
    "innovative",
    "versatile",
    "carefully crafted",
    "thoughtfully designed",
    "beautiful",
    "inspirational",
    "creative-first",
    "designer-friendly"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Follow for fresh typography inspiration every day. 📌",
    "Save your favorite ideas and keep creating. ✨",
    "Join thousands of typography lovers. 💎",
    "Discover new fonts with every visit. 🚀",
    "Your next favorite font is waiting here. 🎨",
    "Keep exploring, creating, and inspiring. 💡",
    "Find inspiration for every creative journey. 🌟",
    "Let's make every design unforgettable. 🖋️",
    "Turn creativity into beautiful typography. ❤️",
    "Explore more fonts and endless inspiration. 📚",
    "Your creative adventure starts here. 🎯",
    "Save, create, repeat. ✨",
    "Inspiration is only one font away. 🌈",
    "Design without limits. 🚀",
    "Create something amazing today. 🎨",
    "Discover typography you'll want to save. 📌",
    "Find fonts that fit every creative vision. 💎",
    "Keep your creativity flowing every day. 🌟",
    "Explore, create, inspire. ❤️",
    "Beautiful typography begins here. ✨"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    project1, project2 = random.sample(project_types, 2)
    content = random.choice(content_types)
    style1, style2 = random.sample(styles, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Discover {style1} and {style2} fonts, perfect for {project1} or {project2}. Expect {content} that will spark your creativity. {closing}",
        f"{intro} From {style1} to {style2}, we bring you fonts for {project1} and {project2}. Packed with {content} to inspire your designs. {closing}",
        f"{intro} Your source of {content} for {project1} and {project2}. Featuring {style1} & {style2} fonts to make your projects stand out. {closing}",
        f"{intro} We showcase {style1} and {style2} typefaces, ideal for {project1} as well as {project2}. Fresh {content} every day. {closing}",
        f"{intro} Fonts in {style1} and {style2} styles, curated for {project1} and {project2}. Dive into our {content} and elevate your work. {closing}",
        f"{intro} Explore {content} built around {style1} and {style2} designs. Best suited for {project1} or {project2}. {closing}",
        f"{intro} Handpicked {style1} and {style2} fonts for {project1} & {project2}, plus {content} to keep you inspired. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST IF FILE EXECUTED DIRECTLY ====
if __name__ == "__main__":
    print(generate_description())