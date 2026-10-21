import random

# ==== INTRO PHRASES (Вводные фразы - 100% позитив) ====
intro_phrases = [
    "🌿 Welcome to your peaceful sanctuary for deep, restorative sleep!",
    "✨ Discover the secrets to calming your mind and sleeping soundly!",
    "🌾 Your daily guide to natural sleep solutions and bedtime peace!",
    "💤 Learn how to naturally reset your sleep cycle and wake up refreshed!",
    "🌱 Explore peaceful bedtime rituals, natural herbs, and deep relaxation!",
    "🌻 Join a community passionate about sleep wellness and quiet minds!",
    "🌙 From calming teas to natural remedies — everything you need for sleep success!",
    "🪴 Practical knowledge for deep sleep dreamers and night relaxation!",
    "🧘 Helping you regulate your nervous system for ultimate bedtime peace!",
    "✨ Discover traditional herbal sleep secrets that still work today!"
]

# ==== SLEEP TOPICS (Темы, о которых пишем - без негатива) ====
topics = [
    "deep sleep solutions",
    "natural sleep remedies",
    "bedtime rituals",
    "calming herbs",
    "sleep hygiene tips",
    "nervous system regulation",
    "vagus nerve relaxation",
    "melatonin alternatives",
    "peaceful mind techniques",
    "nighttime routine ideas",
    "somatic sleep exercises",
    "herbal sleep elixirs",
    "muscle relaxation guides",
    "quiet mind habits",
    "restorative sleep support",
    "bedtime aromatherapy",
    "deep sleep vitamins",
    "evening wind down",
    "calming teas",
    "sleep wellness"
]

# ==== CONTENT TYPES (Типы контента) ====
content_types = [
    "step-by-step guides",
    "nighttime routines",
    "helpful sleep checklists",
    "expert sleep tips",
    "inspiring bedtime ideas",
    "natural remedy recipes",
    "beginner sleep tutorials",
    "herbal sleep guides",
    "deep relaxation techniques",
    "sleep support blueprints",
    "easy evening routines",
    "somatic calming practices"
]

# ==== FOCUS AREAS (Главные цели и результаты) ====
focus_areas = [
    "deep restorative sleep",
    "complete bedtime relaxation",
    "optimal sleep quality",
    "calming a busy mind",
    "regulating your nervous system",
    "waking up energized",
    "natural sleep wellness",
    "peaceful sleeping habits",
    "healthy sleep hygiene",
    "effortless falling asleep"
]

# ==== CLOSING PHRASES (Призывы к действию) ====
closing_phrases = [
    "Follow us for daily deep sleep inspiration! 🌙",
    "Start sleeping better and waking up refreshed! ✨",
    "Join thousands who are reclaiming their peaceful nights! 💤",
    "Your journey to effortless sleep starts here! 🌿",
    "Calm your mind, soothe your body, and sleep well! 🌱",
    "Learn how to relax and sleep deeply every single night! 🌻",
    "A peaceful night begins with a quiet mind — follow along! 🧘",
    "Create a more relaxed and well-rested future! 🌾",
    "Discover the freedom of deep, natural sleep! 🌙",
    "Let's build a peaceful bedtime routine together! 🏡"
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

        f"{intro} Learn valuable sleep skills through {topic1}, {topic2}, and other {content}. Perfect for those pursuing {focus1}. {closing}",

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