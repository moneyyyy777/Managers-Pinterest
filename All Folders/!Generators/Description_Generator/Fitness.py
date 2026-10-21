import random

# ==== INTRO PHRASES (Вводные фразы - без привязки к месту тренировок) ====
intro_phrases = [
    "🌿 Welcome to your daily source of fitness and body glow inspiration!",
    "✨ Discover simple workout habits that support a vibrant, healthy lifestyle!",
    "💪 Explore strength-focused ideas for feeling your absolute best every day!",
    "⚡ Find fresh inspiration for effective workouts and glowing body routines!",
    "💚 Helping you build sustainable fitness and health habits with ease!",
    "🥗 Discover active routines, workout tips, and aesthetic body ideas!",
    "🌱 Small active choices can lead to incredible body transformations!",
    "👟 Explore practical ways to support your personal fitness journey!",
    "🔋 Your ultimate destination for body toning and healthy lifestyle inspiration!",
    "🌞 Feel energized with fitness tips, versatile workouts, and wellness habits!"
]

# ==== FITNESS & BEAUTY TOPICS (Темы без указания локации) ====
topics = [
    "versatile workout routines",
    "body toning exercises",
    "glowing skin fitness",
    "strength training habits",
    "cardio and endurance",
    "full body transformations",
    "core strengthening",
    "post-workout recovery",
    "lean muscle building",
    "fitness-friendly nutrition",
    "morning movement rituals",
    "mindful stretching",
    "weight management tips",
    "joint-friendly exercises",
    "daily energy boosters",
    "fat burning workouts",
    "flexible mobility routines",
    "workout nutrition tips",
    "body sculpting habits",
    "holistic wellness routines"
]

# ==== CONTENT TYPES (Типы контента) ====
content_types = [
    "step-by-step workout guides",
    "daily fitness routines",
    "helpful body toning checklists",
    "expert exercise tips",
    "inspiring active lifestyle ideas",
    "proven fitness blueprints",
    "beginner workout tutorials",
    "sculpting exercise guides",
    "deep physical recovery techniques",
    "fitness support blueprints",
    "easy-to-follow workout routines",
    "somatic movement practices"
]

# ==== FOCUS AREAS (Главные цели и результаты) ====
focus_areas = [
    "building active strength",
    "achieving complete body toning",
    "optimal physical vitality",
    "sculpting lean muscles",
    "boosting daily energy levels",
    "supporting sustainable fitness habits",
    "natural body glowing wellness",
    "healthy exercise hygiene",
    "effortless lifestyle improvements",
    "attaining overall well-being"
]

# ==== CLOSING PHRASES (Призывы к действию - без эмодзи дома) ====
closing_phrases = [
    "Follow us for daily fitness and beauty inspiration! ⚡",
    "Start building a stronger, healthier body today! 💚",
    "Join a community passionate about active living! 💪",
    "Your personal fitness journey starts right here! 🌿",
    "Tone your body, boost your energy, and live well! 🌱",
    "Learn how to stay fit and energized every single day! 🌻",
    "A vibrant future begins with a strong body — follow along! 🧘",
    "Create a healthier and more active lifestyle! 👟",
    "Discover the freedom of natural, lifelong vitality! 🌟",
    "Let's build an inspiring workout routine together! ⚡"
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

        f"{intro} Learn valuable fitness skills through {topic1}, {topic2}, and other {content}. Perfect for those pursuing {focus1}. {closing}",

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