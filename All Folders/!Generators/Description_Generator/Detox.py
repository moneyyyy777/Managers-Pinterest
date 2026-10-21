import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🥒 Welcome to your daily source of healthy living inspiration!",
    "🌿 Discover simple habits that support a healthier lifestyle!",
    "✨ Explore wellness-focused ideas for feeling your best!",
    "🍋 Find fresh inspiration for clean eating and healthy routines!",
    "💚 Helping you build sustainable wellness habits every day!",
    "🥗 Discover nutritious recipes, healthy tips, and wellness ideas!",
    "🌱 Small healthy choices can lead to big transformations!",
    "🍏 Explore practical ways to support your wellness journey!",
    "🥤 Your destination for healthy lifestyle inspiration!",
    "🌞 Feel refreshed with wellness tips, recipes, and healthy habits!"
]

# ==== DETOX / WELLNESS TOPICS ====
topics = [
    "green smoothies",
    "healthy recipes",
    "wellness routines",
    "hydration habits",
    "clean eating",
    "healthy meal planning",
    "morning wellness rituals",
    "juice recipes",
    "gut-friendly foods",
    "natural wellness",
    "healthy snacks",
    "weight management",
    "mindful eating",
    "healthy drinks",
    "fitness-friendly nutrition",
    "wellness challenges",
    "balanced lifestyle",
    "self-care habits",
    "daily wellness tips",
    "healthy transformations"
]

# ==== CONTENT TYPES ====
content_types = [
    "healthy living tips",
    "wellness guides",
    "recipe collections",
    "practical advice",
    "meal ideas",
    "wellness inspiration",
    "nutrition tips",
    "healthy habit strategies",
    "step-by-step guides",
    "lifestyle recommendations",
    "wellness resources",
    "healthy routines",
    "educational content",
    "motivation and inspiration",
    "everyday wellness ideas"
]

# ==== FOCUS AREAS ====
focus_areas = [
    "healthy living",
    "wellness",
    "balanced nutrition",
    "sustainable habits",
    "healthy routines",
    "mindful eating",
    "daily energy",
    "lifestyle improvement",
    "nutrition awareness",
    "overall well-being"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Follow us for daily wellness inspiration! 🌿",
    "Start building healthier habits today! 💚",
    "Discover new healthy ideas every day! 🍏",
    "Your wellness journey starts with small steps! ✨",
    "Find motivation for a healthier lifestyle! 🌞",
    "Learn practical ways to support your well-being! 🥗",
    "Explore recipes, routines, and wellness tips! 🥒",
    "Stay inspired on your path to healthier living! 🍋",
    "Healthy habits begin here! 🌱",
    "Join a community passionate about wellness! 🥤"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)

    topic1, topic2 = random.sample(topics, 2)
    content = random.choice(content_types)

    focus1, focus2 = random.sample(focus_areas, 2)

    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Explore {topic1} and {topic2} through {content}. Helping you improve {focus1} and {focus2}. {closing}",

        f"{intro} Discover practical ideas about {topic1} and {topic2}. Packed with {content} for anyone interested in {focus1}. {closing}",

        f"{intro} Your source for {content}, covering everything from {topic1} to {topic2}. Build confidence in {focus1} and {focus2}. {closing}",

        f"{intro} Learn through {topic1}, {topic2}, and other {content}. Perfect for those focused on {focus1}. {closing}",

        f"{intro} We share {content} centered around {topic1} and {topic2}, helping you embrace {focus1} and {focus2}. {closing}",

        f"{intro} Find inspiration, recipes, and practical ideas for {topic1} and {topic2}. Take the next step toward {focus1}. {closing}",

        f"{intro} From {topic1} to {topic2}, our {content} help make {focus1} and {focus2} part of everyday life. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST ====
if __name__ == "__main__":
    print(generate_description())