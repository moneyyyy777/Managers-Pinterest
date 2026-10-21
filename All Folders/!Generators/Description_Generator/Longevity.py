import random

# ==== INTRO PHRASES (Вводные фразы - 100% позитив и энергия) ====
intro_phrases = [
    "🌿 Welcome to your ultimate guide for active longevity and lifelong vitality!",
    "✨ Discover the science-backed secrets to staying strong and feeling years younger!",
    "🧬 Your daily destination for cellular health, physical strength, and healthy aging!",
    "💪 Learn how to naturally protect your muscles, boost your energy, and age gracefully!",
    "🌱 Explore practical longevity tips, nutritious habits, and timeless physical wellness!",
    "⚡ Join a community passionate about extending healthspan and unlocking youthful energy!",
    "🌙 From cellular regeneration to active strength training — everything you need to feel your best!",
    "🪴 Practical knowledge for anyone determined to stay fit, independent, and vibrant!",
    "🧘 Helping you master physical stability, deep vitality, and healthy lifestyle habits!",
    "✨ Discover traditional and modern longevity secrets that keep your body feeling young!"
]

# ==== LONGEVITY TOPICS (Темы, о которых пишем) ====
topics = [
    "active longevity solutions",
    "cellular health secrets",
    "muscle loss prevention",
    "strength training for longevity",
    "anti-aging lifestyle tips",
    "mitochondrial health habits",
    "sarcopenia prevention",
    "youthful energy boosters",
    "healthspan optimization",
    "cellular regeneration guides",
    "natural vitality remedies",
    "physical stability exercises",
    "balance and mobility routines",
    "nutrient-dense longevity foods",
    "dna repair supplements",
    "healthy aging habits",
    "over 40 fitness strategies",
    "restorative physical wellness",
    "joint-friendly workouts",
    "peptide and cell support"
]

# ==== CONTENT TYPES (Типы контента) ====
content_types = [
    "step-by-step longevity guides",
    "daily vitality routines",
    "helpful physical health checklists",
    "expert healthy aging tips",
    "inspiring active lifestyle ideas",
    "science-backed wellness blueprints",
    "beginner strength tutorials",
    "cellular health guides",
    "deep physical regeneration techniques",
    "longevity support blueprints",
    "easy joint-friendly routines",
    "somatic vitality practices"
]

# ==== FOCUS AREAS (Главные цели и результаты) ====
focus_areas = [
    "deep physical vitality",
    "maintaining lifelong strength",
    "optimal physical stability",
    "preventing age-related muscle loss",
    "reclaiming youthful energy",
    "extending your healthspan",
    "natural cellular regeneration",
    "healthy aging habits",
    "preventing physical decline",
    "waking up strong and energized"
]

# ==== CLOSING PHRASES (Призывы к действию) ====
closing_phrases = [
    "Follow us for daily longevity inspiration! 🧬",
    "Start building a stronger, healthier future today! 💪",
    "Join thousands reclaiming their strength and youthfulness! ✨",
    "Your journey to active longevity starts here! 🌿",
    "Stay strong, protect your muscles, and live vibrant! 🌱",
    "Learn how to feel energized and younger every single day! ⚡",
    "A vibrant future begins with a strong body — follow along! 🧘",
    "Create a healthier and more active longevity path! 🪴",
    "Discover the freedom of natural, lifelong vitality! 🌟",
    "Let's build a strong, ageless routine together! 🏡"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)

    topic1, topic2 = random.sample(topics, 2)
    content = random.choice(content_types)

    focus1, focus2 = random.sample(focus_areas, 2)

    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Explore {topic1} and {topic2} through {content}. Helping you master {focus1} and {focus2}. {closing}",

        f"{intro} Discover practical knowledge about {topic1} and {topic2}. Packed with {content} for anyone interested in {focus1}. {closing}",

        f"{intro} Your source for {content}, covering everything from {topic1} to {topic2}. Build confidence in {focus1} and {focus2}. {closing}",

        f"{intro} Learn valuable longevity skills through {topic1}, {topic2}, and other {content}. Perfect for those pursuing {focus1}. {closing}",

        f"{intro} We share {content} focused on {topic1} and {topic2}, helping you create a lifestyle centered around {focus1} and {focus2}. {closing}",

        f"{intro} Find inspiration, {content}, and proven ideas for {topic1} and {topic2}. Take the next step toward {focus1}. {closing}",

        f"{intro} From {topic1} to {topic2}, our {content} help make {focus1} and {focus2} achievable for everyone. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST ====
if __name__ == "__main__":
    print("Примеры сгенерированных описаний:")
    print("-" * 50)
    for i in range(3):
        print(f"Вариант {i+1}:")
        print(generate_description())
        print("-" * 50)