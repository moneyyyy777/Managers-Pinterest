import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🎨✨ Welcome to the creative universe of digital brushes!",
    "🌟 Step into a world where every stroke becomes art!",
    "💎 Your daily source of unique and inspiring brush designs!",
    "🔥 Explore digital painting like never before!",
    "📚 Discover the tools that bring your imagination to life!",
    "✨ Where art meets technology — and brushes make magic!",
    "🎯 Unlock your inner artist with our premium brush sets!",
    "💡 Inspiring brush ideas for every creative soul!",
    "📌 Find the perfect brush for your unique vision!",
    "🎨 Turn strokes into masterpieces with our brush collections!",
    "💬 Brushes that express what words cannot!",
    "🎭 From soft watercolor to bold ink — all in one place!",
    "🔍 Explore the hidden texture behind every brushstroke!",
    "🚀 Take your artwork to the next level with unique brushes!",
    "❤️ Brushes that tell a story — make yours unforgettable!",
    "🎨 Elevate your creative game with stunning brush packs!",
    "💎 Curated tools for digital artists, illustrators, and dreamers!",
    "📜 Every brush has a soul — discover them with us!",
    "💫 Inspiration for your next artwork starts here!",
    "🎉 Brushes that inspire, art that lasts!"
]

# ==== PROJECT TYPES ====
project_types = [
    "digital illustrations", "portraits", "concept art", "tattoo sketches",
    "comics", "character design", "fashion illustration", "landscapes",
    "poster design", "cover art", "calligraphy projects", "logo sketches",
    "storyboarding", "manga art", "texture painting", "watercolor art",
    "line art", "background design", "digital paintings", "procreate art",
    "photoshop artwork", "brush lettering", "sketchbook pages", "fantasy art"
]

# ==== CONTENT TYPES ====
content_types = [
    "collections", "brush tips", "painting techniques", "creative guides",
    "inspirations", "tutorials", "case studies", "ideas for artists",
    "texture showcases", "behind-the-scenes stories", "practical advice",
    "digital painting tricks", "color blending guides", "stroke techniques",
    "artistic workflows"
]

# ==== STYLES ====
styles = [
    "watercolor", "ink", "charcoal", "pencil", "marker", "pastel",
    "oil paint", "acrylic", "airbrush", "grunge", "texture", "neon",
    "sketch", "comic", "realistic", "procreate", "photoshop", "gouache",
    "metallic", "soft shading", "dry brush", "wet media", "stippling",
    "calligraphic", "spray", "gradient"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Subscribe and keep your creativity flowing! 📌",
    "Follow us for endless digital art inspiration! ✨",
    "Let’s create something unforgettable together! 🎯",
    "Join our artistic community today! 💎",
    "Don’t miss the next wave of brush inspiration! 🚀",
    "Your next masterpiece starts with the perfect brush — start now! 🖌️",
    "Turn your artistic dreams into reality with our brush packs! 🌟",
    "Let the right brush bring your vision to life! 🎨",
    "Transform your strokes into visual poetry! 💫",
    "Your brush journey begins here! 💡"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    project1, project2 = random.sample(project_types, 2)
    content = random.choice(content_types)
    style1, style2 = random.sample(styles, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Discover {style1} and {style2} brushes, perfect for {project1} or {project2}. Expect {content} that will spark your creativity. {closing}",
        f"{intro} From {style1} to {style2}, we bring you brushes for {project1} and {project2}. Packed with {content} to inspire your art. {closing}",
        f"{intro} Your source of {content} for {project1} and {project2}. Featuring {style1} & {style2} brushes to make your artwork stand out. {closing}",
        f"{intro} We showcase {style1} and {style2} brush sets, ideal for {project1} as well as {project2}. Fresh {content} every day. {closing}",
        f"{intro} Brushes in {style1} and {style2} styles, curated for {project1} and {project2}. Dive into our {content} and elevate your work. {closing}",
        f"{intro} Explore {content} built around {style1} and {style2} designs. Best suited for {project1} or {project2}. {closing}",
        f"{intro} Handpicked {style1} and {style2} brushes for {project1} & {project2}, plus {content} to keep you inspired. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST IF FILE EXECUTED DIRECTLY ====
if __name__ == "__main__":
    print(generate_description())
