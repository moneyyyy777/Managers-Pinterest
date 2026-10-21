import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (CALMING & ANTISTRESS - БЕЗ НЕГАТИВА) ======
adjectives = [
    "Calm", "Peaceful", "Serene", "Tranquil", "Quiet", "Soothing", "Gentle", 
    "Harmonious", "Blissful", "Restorative", "Healing", "Warm", "Balanced", 
    "Nourishing", "Pure", "Organic", "Natural", "Holistic", "Radiant", "Bright", 
    "Mindful", "Centered", "Grounded", "Cozy", "Ethereal", "Safe", "Secure", 
    "Soft", "Vibrant", "Still", "Rested", "Balmy", "Sweet", "Sunny", "Luminous", 
    "Ambient", "Comforting", "Somatic", "Herbal", "Botanical", "Vagus", 
    "Joyful", "Flowing", "Delicate", "Aura", "Zenlike"
] * 4  # умножаем список для расширения базы при генерации

# ====== СУЩЕСТВИТЕЛЬНЫЕ (PEACE & WELLNESS CORE) ======
nouns = [
    "Calm", "Peace", "Serenity", "Tranquility", "Relief", "Balance", "Zen", 
    "Harmony", "Oasis", "Haven", "Sanctuary", "Garden", "Soul", "Mind", 
    "Spirit", "Wellness", "Healing", "Flow", "Breath", "Stillness", "Solace", 
    "Joy", "Bliss", "Meadow", "Retreat", "Herbs", "Botanicals", "Rituals", 
    "Habits", "Routines", "Blueprint", "Method", "Solutions", "Guide", 
    "Apothecary", "Tinctures", "Tea", "Capsules", "Academy", "Club", "Hub", 
    "Lab", "Journey", "Knowledge", "Living", "Lifestyle"
] * 4

# ====== МОДИФИКАТОРЫ ======
modifiers = [
    "Pro", "Elite", "Lab", "Club", "Academy", "Studio", "Works", 
    "Blueprint", "Method", "System", "Framework", "Collective", 
    "Network", "Hub", "Expert", "Guide", "Nation", "Alliance", "HQ", "Masters"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "-", "x", "to"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # Простые и эстетичные (например, "Calm Haven", "Soothing Rituals")
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # Премиум-бренды (например, "Tranquil Soul Academy", "Holistic Flow Lab")
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # Экспертные названия (например, "Wellness Blueprint", "Serenity Method")
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # Двойные эстетичные комбинации (например, "Grounded Mind & Peaceful Haven")
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # Тематические связки (например, "Herbs for Serenity", "Rituals to Calm")
        f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # Короткие запоминающиеся варианты
        f"{random.choice(adjectives)} {random.choice(nouns)}"
    ]

    return random.choice(structures)

# ====== ТЕСТ ======
if __name__ == "__main__":
    # Выведем 10 случайных имен для проверки генерации
    print("Примеры сгенерированных имен аккаунтов (Антистресс без негатива):")
    for _ in range(10):
        print(f"- {generate_brand_name()}")