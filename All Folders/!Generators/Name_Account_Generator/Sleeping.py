import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (SLEEP & INSOMNIA) ======
adjectives = [
    "Deep", "Cozy", "Dreamy", "Restful", "Silent", "Peaceful", "Tranquil", 
    "Slumbering", "Calm", "Serene", "Gentle", "Natural", "Holistic", "Soothing", 
    "Relaxing", "Organic", "Midnight", "Bedtime", "Restorative", "Healing", 
    "Sound", "Blissful", "Quiet", "Heavy", "Nourishing", "Balanced", "Earthy", 
    "Pure", "Wholesome", "Vivid", "Sweet", "Ethereal", "Ambient", "Radiant", 
    "Comforting", "Fast", "Somatic", "Herbal", "Botanical", "CortisolFree",
    "Restless", "Sleepy", "Vagus", "Nocturnal", "Sleepless", "Overnight"
] * 4  # умножаем список для расширения базы при генерации

# ====== СУЩЕСТВИТЕЛЬНЫЕ (SLEEP CORE) ======
nouns = [
    "Sleep", "Slumber", "Dreams", "Rest", "Remedies", "Relief", 
    "Calm", "Serenity", "Tranquility", "SleepAid", "Support", "Science", 
    "Hacks", "Rituals", "Habits", "Routines", "Blueprint", "Method", 
    "Solutions", "Guide", "Mind", "Brain", "Vagus", "Melatonin", 
    "Herbs", "Botanicals", "Wellness", "Healing", "Naps", "Sleeplessness", 
    "Apothecary", "Tinctures", "Tea", "Capsules", "Academy", "Club", "Hub", 
    "Lab", "Journey", "Knowledge", "Living", "Lifestyle", "Nights", "Bedtime"
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
        # Простые и звучные (например, "Deep Slumber", "Silent Remedies")
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # Премиум-бренды (например, "Restful Sleep Academy", "Calm Mind Lab")
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # Экспертные названия (например, "Insomnia Expert", "Sleep Blueprint")
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # Двойные длинные комбинации (например, "Cozy Sleep x Calm Mind")
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # Тематические связки (например, "Herbs for Insomnia", "Remedies to Sleep")
        f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # Catchy короткие варианты
        f"{random.choice(adjectives)} {random.choice(nouns)}"
    ]

    return random.choice(structures)

# ====== ТЕСТ ======
if __name__ == "__main__":
    # Выведем 10 случайных имен для проверки генерации
    print("Примеры сгенерированных имен аккаунтов:")
    for _ in range(10):
        print(f"- {generate_brand_name()}")