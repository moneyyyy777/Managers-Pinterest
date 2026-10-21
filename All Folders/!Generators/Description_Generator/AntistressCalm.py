import random

# ==== INTRO PHRASES (Вводные фразы - 100% позитив) ====
intro_phrases = [
    "🌿 Welcome to your calm space for daily peace and mental clarity!",
    "✨ Discover how to restore inner balance and live mindfully!",
    "🌾 Your daily guide to calming your mind, relaxing your body, and finding peace!",
    "🧘 Learn simple, natural ways to reset your mood and feel grounded!",
    "🌱 Explore holistic remedies, gentle wellness practices, and pure relaxation!",
    "🌻 Join a supportive community passionate about emotional balance and inner harmony!",
    "🕊️ From natural adaptogens to calming rituals — everything you need for mental wellness!",
    "🪴 Practical wisdom for a centered mind and a peaceful daily lifestyle!",
    "✨ Helping you soothe your nervous system and cultivate daily joy!",
    "🌿 Discover traditional, plant-based remedies to bring calmness into your busy life!"
]

# ==== ANTISTRESS TOPICS (Темы, о которых пишем - без негатива) ====
topics = [
    "mindful breathing",
    "natural adaptogens",
    "calming herbal remedies",
    "somatic release practices",
    "inner peace rituals",
    "mood balancing tips",
    "emotional wellness",
    "holistic mental health",
    "vagus nerve soothing",
    "nervous system regulation",
    "peaceful mind habits",
    "grounding techniques",
    "daily relaxation tips",
    "natural mood stabilizers",
    "mind-body healing",
    "gentle wellness habits",
    "evening wind down",
    "restorative plant medicine",
    "stillness practices",
    "herbal calmative guides"
]

# ==== CONTENT TYPES (Типы контента) ====
content_types = [
    "mindfulness guides",
    "step-by-step rituals",
    "helpful calming checklists",
    "expert wellness advice",
    "inspiring peaceful ideas",
    "natural remedy recipes",
    "beginner meditation tips",
    "somatic healing tutorials",
    "emotional support guides",
    "daily wellness blueprints",
    "grounding exercises",
    "herbal relaxation tips"
]

# ==== FOCUS AREAS (Главные цели и результаты) ====
focus_areas = [
    "finding daily calmness",
    "soothing your body",
    "cultivating inner peace",
    "balancing your mood",
    "living with mindful ease",
    "achieving mental clarity",
    "natural emotional support",
    "restoring your energy",
    "developing calm habits",
    "somatic nervous system reset"
]

# ==== CLOSING PHRASES (Призывы к действию) ====
closing_phrases = [
    "Follow us for daily peace and mindfulness inspiration! 🌿",
    "Start your journey toward a calmer, more balanced life! ✨",
    "Join thousands learning to live with mindful ease! 🧘",
    "Your path to daily serenity and calm begins here! 🕊️",
    "Soothe your mind, ground your body, and thrive! 🌱",
    "Learn something new to bring peace to your life every day! 🌻",
    "A calmer life starts with a single mindful breath — follow along! 🧘",
    "Create a more resilient and peaceful future! 🌾",
    "Discover the freedom of a quiet, centered mind! 🕊️",
    "Let's build a peaceful and balanced life together! 🏡"
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