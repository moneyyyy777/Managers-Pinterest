import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🌿 Welcome to the world of herbal wisdom and natural wellness!",
    "🍃 Discover the healing power of herbs and plants!",
    "✨ Your daily source of herbal inspiration and traditional remedies!",
    "🌱 Explore natural solutions rooted in generations of knowledge!",
    "🌼 Learn how herbs can support a healthier lifestyle!",
    "🌸 Discover medicinal plants, herbal remedies, and holistic living!",
    "🫖 Helping you reconnect with nature through herbalism!",
    "🌿 Explore the fascinating world of plant medicine!",
    "🍀 Natural wellness starts with understanding the plants around us!",
    "🌺 Discover ancient herbal traditions for modern living!"
]

# ==== HERBALISM TOPICS ====
topics = [
    "medicinal herbs",
    "herbal remedies",
    "herbal tea blends",
    "plant medicine",
    "healing herbs",
    "natural wellness",
    "herbal recipes",
    "home apothecary",
    "herbal tinctures",
    "herbal oils",
    "herbal salves",
    "foraging herbs",
    "holistic health",
    "lavender remedies",
    "chamomile benefits",
    "mint varieties",
    "herbal gardening",
    "traditional herbalism",
    "wild medicinal plants",
    "seasonal herbal preparations"
]

# ==== CONTENT TYPES ====
content_types = [
    "herbal guides",
    "natural remedy tutorials",
    "practical herbal tips",
    "plant profiles",
    "traditional wisdom",
    "beginner-friendly lessons",
    "herbal recipes",
    "step-by-step tutorials",
    "wellness inspiration",
    "seasonal herbal ideas",
    "apothecary guides",
    "educational resources",
    "foraging tips",
    "DIY herbal projects",
    "holistic living advice"
]

# ==== FOCUS AREAS ====
focus_areas = [
    "natural wellness",
    "plant-based healing",
    "herbal knowledge",
    "holistic living",
    "traditional remedies",
    "self-reliance",
    "herbal medicine",
    "healthy living",
    "natural health",
    "botanical wellness"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Follow us for daily herbal inspiration! 🌿",
    "Discover the power of nature one herb at a time! 🍃",
    "Start your herbal journey today! 🌼",
    "Learn something new about medicinal plants every day! 🌱",
    "Reconnect with nature through herbal wisdom! ✨",
    "Grow, learn, and thrive with herbalism! 🌸",
    "Build your herbal knowledge naturally! 🍀",
    "Explore traditional remedies and natural wellness! 🌺",
    "Create your own herbal lifestyle! 🫖",
    "Join a community passionate about healing plants! 🌿"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)

    topic1, topic2 = random.sample(topics, 2)
    content = random.choice(content_types)

    focus1, focus2 = random.sample(focus_areas, 2)

    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Explore {topic1} and {topic2} through {content}. Helping you discover {focus1} and {focus2}. {closing}",

        f"{intro} Discover practical knowledge about {topic1} and {topic2}. Packed with {content} for anyone interested in {focus1}. {closing}",

        f"{intro} Your source for {content}, covering everything from {topic1} to {topic2}. Build confidence in {focus1} and {focus2}. {closing}",

        f"{intro} Learn through {topic1}, {topic2}, and other {content}. Perfect for those passionate about {focus1}. {closing}",

        f"{intro} We share {content} focused on {topic1} and {topic2}, helping you embrace {focus1} and {focus2}. {closing}",

        f"{intro} Find inspiration, education, and proven ideas for {topic1} and {topic2}. Take the next step toward {focus1}. {closing}",

        f"{intro} From {topic1} to {topic2}, our {content} help make {focus1} and {focus2} accessible for everyone. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST ====
if __name__ == "__main__":
    print(generate_description())