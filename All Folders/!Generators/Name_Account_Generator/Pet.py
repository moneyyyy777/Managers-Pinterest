import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (PET NICHE) ======
adjectives = [
    "Happy", "Healthy", "Playful", "Cute", "Adorable", "Fluffy",
    "Smart", "Loyal", "Friendly", "Gentle", "Calm", "Active",
    "Cozy", "Premium", "Ultimate", "Modern", "Daily", "Trusted",
    "Expert", "Pro", "Elite", "Perfect", "Tiny", "Big",
    "Energetic", "Balanced", "Safe", "Natural", "Holistic",
    "Luxury", "Comfort", "Carefree", "Loved", "Wild",
    "Indoor", "Outdoor", "Urban", "SmartLife"
] * 4

# ====== СУЩЕСТВИТЕЛЬНЫЕ (PET CORE) ======
nouns = [
    # Общие
    "Pet", "Pets", "Animal", "Companion", "Friend", "Buddy",

    # Уход / лайфстайл
    "Care", "Life", "Lifestyle", "Home", "Family", "Habits", "Guide", "Tips",

    # Обучение / поведение
    "Training", "Behavior", "Obedience", "Skills",

    # Бренд / система
    "System", "Method", "Blueprint", "Plan",
    "Academy", "Club", "World", "Zone",
    "Hub", "Lab", "Store", "Market",

    # Эмоции / связь
    "Bond", "Connection", "Love", "Care",
    "Journey", "Life"
] * 4

# ====== МОДИФИКАТОРЫ ======
modifiers = [
    "Pro", "Elite", "Lab", "HQ", "Club",
    "Academy", "Studio", "Works",
    "System", "Method", "Blueprint",
    "Framework", "Network",
    "Formula", "Protocol",
    "Collective", "Nation", "Hub",
    "Store", "Market", "Supply"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "by", "-", "x"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # 1. Pinterest стиль (самый частый)
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # 2. Бренд / продукт
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # 3. Authority / affiliate
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # 4. Виральная комбинация
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 5. Marketplace / решение
        f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # 6. Короткое имя
        f"{random.choice(adjectives)} {random.choice(nouns)}"
    ]

    return random.choice(structures)

# ====== ТЕСТ ======
if __name__ == "__main__":
    print(generate_brand_name())