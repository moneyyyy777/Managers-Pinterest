import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🎉✨ Welcome to the colorful world of stickers!",
    "🌟 Stickers that spark joy and creativity!",
    "💎 Your daily dose of unique and inspiring sticker designs!",
    "🔥 Explore the magic of stickers like never before!",
    "📒 Add personality to your journals and planners with our stickers!",
    "✨ Where creativity meets fun — discover amazing stickers!",
    "🎯 Unlock endless sticker ideas for your projects!",
    "💡 Inspiring sticker concepts for every creative soul!",
    "📌 Find the perfect sticker style for your vision!",
    "🎨 Turn blank pages into art with sticker inspiration!",
    "💬 Stickers that say more than words!",
    "🎭 From cute and playful to bold and edgy — stickers for everyone!",
    "🚀 Take your journaling and crafts to the next level!",
    "❤️ Stickers that tell a story — start your collection today!",
    "🎨 Elevate your creative game with stunning sticker ideas!",
    "💎 Curated sticker sets for planners, diaries, and crafts!",
    "📜 Every sticker adds character — discover them with us!",
    "💫 Inspiration for your next creative project starts here!",
    "🎉 Stickers that inspire, designs that last!",
]

# ==== PROJECT TYPES ====
project_types = [
    "planners", "journals", "scrapbooks", "bullet journals",
    "phone cases", "laptops", "water bottles", "greeting cards",
    "gift wrapping", "notebooks", "skateboards", "car bumpers",
    "photo albums", "craft projects", "wall collages", "party decor",
    "stationery", "stickers packs", "branding", "packaging",
    "school projects", "event invitations", "moodboards", "vision boards"
]

# ==== CONTENT TYPES ====
content_types = [
    "sticker collections", "DIY ideas", "creative guides", "inspirations",
    "tutorials", "styling tips", "design trends", "moodboards",
    "composition tricks", "decor hacks", "case studies", "craft guides",
    "layout ideas", "aesthetic showcases", "behind-the-scenes stories"
]

# ==== STYLES ====
styles = [
    "cute", "minimalist", "aesthetic", "kawaii", "retro", "vintage",
    "modern", "playful", "bold", "pastel", "holographic", "glitter",
    "hand-drawn", "cartoon", "whimsical", "boho", "luxury", "funny",
    "dark", "cyberpunk", "colorful", "elegant", "3D", "doodle",
    "iconic", "pop-art"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Subscribe and get inspired daily! 📌",
    "Follow us for endless sticker magic! ✨",
    "Let’s make your projects unforgettable together! 🎯",
    "Join our creative sticker community today! 💎",
    "Don’t miss the next wave of sticker inspiration! 🚀",
    "Your next masterpiece starts with the right sticker — start now! 🖋️",
    "Turn your creative dreams into reality with stickers! 🌟",
    "Let stickers bring your ideas to life! 📜",
    "Transform your projects into visual art! 🎨",
    "Your sticker journey begins here! 💡"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    project1, project2 = random.sample(project_types, 2)
    content = random.choice(content_types)
    style1, style2 = random.sample(styles, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Discover {style1} and {style2} stickers, perfect for {project1} or {project2}. Expect {content} that will spark your creativity. {closing}",
        f"{intro} From {style1} to {style2}, we bring you stickers for {project1} and {project2}. Packed with {content} to inspire your crafts. {closing}",
        f"{intro} Your source of {content} for {project1} and {project2}. Featuring {style1} & {style2} stickers to make your projects stand out. {closing}",
        f"{intro} We showcase {style1} and {style2} stickers, ideal for {project1} as well as {project2}. Fresh {content} every day. {closing}",
        f"{intro} Stickers in {style1} and {style2} styles, curated for {project1} and {project2}. Dive into our {content} and elevate your projects. {closing}",
        f"{intro} Explore {content} built around {style1} and {style2} sticker designs. Best suited for {project1} or {project2}. {closing}",
        f"{intro} Handpicked {style1} and {style2} stickers for {project1} & {project2}, plus {content} to keep you inspired. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST IF FILE EXECUTED DIRECTLY ====
if __name__ == "__main__":
    print(generate_description())
