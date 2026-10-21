import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🎨✨ Welcome to the creative universe of design resources!",
    "🌟 Step into a world full of textures, colors, and endless inspiration!",
    "💎 Your daily source of premium materials for every designer!",
    "🔥 Explore the art of design with handpicked creative tools!",
    "📚 Discover the essentials that make every project stand out!",
    "✨ Where creativity meets quality — design smarter, not harder!",
    "🎯 Unlock the magic of professional design assets!",
    "💡 Inspiring tools and materials for every creative mind!",
    "📌 Find the perfect resource for your next big idea!",
    "🎨 Turn your concepts into visual masterpieces with our resources!",
    "💬 Design materials that help your vision speak louder!",
    "🎭 From minimal to bold — resources for every design style!",
    "🔍 Explore textures, mockups, and elements that inspire creativity!",
    "🚀 Take your projects to the next level with top-tier design assets!",
    "❤️ Design materials that tell a story — make yours unforgettable!",
    "🎨 Elevate your creative game with stunning digital resources!",
    "💎 Curated design essentials for artists, creators, and dreamers!",
    "📜 Every texture, every element — crafted for your vision!",
    "💫 Inspiration for your next project starts right here!",
    "🎉 Resources that inspire, designs that shine!"
]

# ==== PROJECT TYPES ====
project_types = [
    "branding", "web design", "social media content", "packaging",
    "digital illustration", "poster design", "logo creation",
    "UI/UX projects", "presentations", "business cards",
    "print design", "advertising", "product mockups",
    "flyers", "brochures", "web banners", "portfolio layouts",
    "editorial design", "3D visualization", "merch design",
    "photo editing", "collage art", "motion graphics", "digital marketing"
]

# ==== CONTENT TYPES ====
content_types = [
    "design bundles", "creative assets", "inspirations", "freebies",
    "tutorials", "tips & tricks", "visual guides", "workflow hacks",
    "design trends", "mockup showcases", "composition ideas",
    "color palette inspirations", "layout tips", "creative insights",
    "exclusive design collections"
]

# ==== STYLES ====
styles = [
    "minimalist", "vintage", "modern", "grunge", "aesthetic", "luxury",
    "boho", "pastel", "retro", "bold", "3D", "flat", "photorealistic",
    "illustrative", "neon", "organic", "handcrafted", "geometric",
    "cyberpunk", "elegant", "art deco", "high contrast", "dark mode",
    "vivid", "neutral", "abstract"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Subscribe and get inspired daily! 📌",
    "Follow us for endless creative energy! ✨",
    "Let’s make something unforgettable together! 🎯",
    "Join our designer community today! 💎",
    "Don’t miss the next wave of design inspiration! 🚀",
    "Your next masterpiece starts with the right resource — start now! 🧩",
    "Turn your creative vision into reality with our materials! 🌟",
    "Let the right tools elevate your art! 🎨",
    "Transform your ideas into visuals that inspire! 💫",
    "Your design journey begins here! 💡"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    project1, project2 = random.sample(project_types, 2)
    content = random.choice(content_types)
    style1, style2 = random.sample(styles, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Discover {style1} and {style2} design materials, perfect for {project1} or {project2}. Expect {content} that will boost your creativity. {closing}",
        f"{intro} From {style1} to {style2}, we bring you resources for {project1} and {project2}. Packed with {content} to inspire your next project. {closing}",
        f"{intro} Your source of {content} for {project1} and {project2}. Featuring {style1} & {style2} resources to make your designs stand out. {closing}",
        f"{intro} We showcase {style1} and {style2} materials, ideal for {project1} as well as {project2}. Fresh {content} every day. {closing}",
        f"{intro} Design resources in {style1} and {style2} styles, curated for {project1} and {project2}. Dive into our {content} and elevate your work. {closing}",
        f"{intro} Explore {content} built around {style1} and {style2} visuals. Best suited for {project1} or {project2}. {closing}",
        f"{intro} Handpicked {style1} and {style2} materials for {project1} & {project2}, plus {content} to keep you inspired. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST IF FILE EXECUTED DIRECTLY ====
if __name__ == "__main__":
    print(generate_description())
