import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (ESTHETIC / WELLNESS / LIFE) ======
adjectives = [
    "Healthy", "Mindful", "Balanced", "Natural", "Radiant", "Pure", "Simple",
    "Vital", "Energized", "Holistic", "Vibrant", "Fresh", "Light", "Daily",
    "Active", "Optimal", "Clean", "Glowing", "Conscious", "Sustainable",
    "Morning", "Organic", "Whole", "Happy", "Soulful", "Serene", "Essential",
    "Bright", "Optimal", "Inspired", "Aesthetic", "Minimal", "Gentle"
] * 4

# ====== СУЩЕСТВИТЕЛЬНЫЕ (HABITS / LIFE / BODY) ======
nouns = [
    "Life", "Lifestyle", "Habits", "Routine", "Wellness", "Health", "Body",
    "Journey", "Flow", "Balance", "Nutrition", "Energy", "Rituals", "Vibes",
    "Mindset", "SelfCare", "Spirit", "Essence", "Path", "Daily", "Bloom",
    "Choice", "Living", "Space", "Ways", "Harmony", "Wisdom", "Notes"
] * 4

# ====== МОДИФИКАТОРЫ (BLOG / ACADEMY / STUDIO) ======
modifiers = [
    "Daily", "Studio", "Journal", "Collective", "Society", "Club", "Lab",
    "Project", "Guide", "Diaries", "Method", "Space", "Way", "Notes",
    "Hacks", "Academy", "Community", "Blueprint", "Essentials", "Life"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "with", "x", "and"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # 1. Популярный блог-стайл (напр. Mindful Habits, Healthy Bloom)
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # 2. Эстетичное сообщество (напр. Balanced Life Collective, Radiant Body Studio)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # 3. Авторский метод (напр. Wellness Diaries, Habit Space)
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # 4. Вдохновляющий длинный (напр. Simple Life & Healthy Body)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 5. Коротко и стильно (напр. Healthy x Habits)
        f"{random.choice(adjectives)} {random.choice(connectors)} {random.choice(nouns)}",

        # 6. Душевный формат (напр. Soulful Rituals, Daily Flow)
        f"{random.choice(adjectives)} {random.choice(nouns)}"
    ]

    return random.choice(structures)

# ====== ТЕСТ ======
if __name__ == "__main__":
    print(generate_brand_name())