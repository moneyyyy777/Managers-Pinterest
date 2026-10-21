import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🌸 Welcome to the world of beautiful flower gardens!",
    "🌷 Discover stunning blooms and inspiring garden ideas!",
    "🌹 Your daily source of flower garden inspiration!",
    "✨ Create a garden filled with color, fragrance, and beauty!",
    "🌺 Explore breathtaking flower beds and garden designs!",
    "🌼 Everything you need to grow a flourishing flower garden!",
    "🦋 Find inspiration for cottage gardens, pollinator gardens, and more!",
    "🌻 Discover the secrets behind vibrant blooms all season long!",
    "💐 Helping gardeners create beautiful outdoor spaces!",
    "🏡 Transform your garden into a floral paradise!"
]

# ==== FLOWER GARDEN TOPICS ====
topics = [
    "flower beds",
    "rose gardens",
    "peony gardens",
    "hydrangea gardens",
    "lavender gardens",
    "cottage gardens",
    "pollinator gardens",
    "butterfly gardens",
    "cut flower gardens",
    "perennial flowers",
    "seasonal blooms",
    "garden design",
    "garden borders",
    "wildflower gardens",
    "spring flowers",
    "summer blooms",
    "garden pathways",
    "flower arrangements",
    "garden landscaping",
    "colorful flower displays"
]

# ==== CONTENT TYPES ====
content_types = [
    "garden ideas",
    "design inspiration",
    "growing guides",
    "flower care tips",
    "expert advice",
    "seasonal recommendations",
    "planting tutorials",
    "garden plans",
    "landscaping inspiration",
    "flower combinations",
    "practical gardening tips",
    "garden makeovers",
    "step-by-step guides",
    "creative outdoor ideas",
    "beautiful garden examples"
]

# ==== FOCUS AREAS ====
focus_areas = [
    "beautiful blooms",
    "garden design",
    "flower gardening",
    "outdoor living",
    "pollinator-friendly gardens",
    "cottage garden style",
    "seasonal color",
    "garden beauty",
    "landscape inspiration",
    "flower-filled spaces"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Follow us for daily flower garden inspiration! 🌷",
    "Create the garden you've always dreamed about! 🌸",
    "Discover new flowers and design ideas every day! 🌺",
    "Let's grow something beautiful together! 🌻",
    "Bring more color and life to your garden! 💐",
    "Turn your outdoor space into a blooming paradise! 🌹",
    "Join our community of flower lovers! 🦋",
    "Find inspiration for every season of the year! 🌼",
    "Make every corner of your garden bloom! ✨",
    "Start planning your dream flower garden today! 🏡"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)

    topic1, topic2 = random.sample(topics, 2)
    content = random.choice(content_types)

    focus1, focus2 = random.sample(focus_areas, 2)

    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Explore {topic1} and {topic2} through {content}. Helping you create {focus1} and {focus2}. {closing}",

        f"{intro} Discover beautiful ideas for {topic1} and {topic2}. Packed with {content} to inspire your next garden project. {closing}",

        f"{intro} Your source for {content}, covering everything from {topic1} to {topic2}. Perfect for anyone passionate about {focus1}. {closing}",

        f"{intro} Learn how to create stunning gardens with tips on {topic1}, {topic2}, and more. Build a space full of {focus1} and {focus2}. {closing}",

        f"{intro} Find inspiration for {topic1} and {topic2} through our collection of {content}. Bring more {focus1} to your landscape. {closing}",

        f"{intro} We share {content}, flower-growing ideas, and design inspiration centered around {topic1} and {topic2}. {closing}",

        f"{intro} From {topic1} to {topic2}, discover {content} that help transform ordinary spaces into {focus2}. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST ====
if __name__ == "__main__":
    print(generate_description())