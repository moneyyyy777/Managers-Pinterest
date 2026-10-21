import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (ЗДОРОВЬЕ, КРАСОТА, ТОНУС, ЭНЕРГИЯ) ======
adjectives = [
    "Healthy", "Radiant", "Glowing", "Fit", "Strong", "Vital", "Vibrant", "Sculpted", 
    "Toned", "Lean", "Active", "Balanced", "Fresh", "Pure", "Dynamic", "Ultimate", 
    "Absolute", "Flawless", "Energetic", "Powerful", "Elegant", "Daily", "Essential", 
    "Effective", "Complete", "Total", "Perfect", "Polished", "Refined", "Harmonic",
    "Bright", "Sleek", "Stunning", "Vivid", "Natural", "Organic", "Mindful", "Rapid"
] * 4  # умножаем список для теста

# ====== СУЩЕСТВИТЕЛЬНЫЕ (ТРЕНИРОВКИ / ТЕЛО / ФИГУРА / КРАСОТА) ======
nouns = [
    "Workout", "Fitness", "Training", "Exercise", "Body", "Muscle", "Shape", "Tone", 
    "Glow", "Energy", "Vitality", "Strength", "Beauty", "Form", "Figure", "Motion", 
    "Flow", "Cardio", "Core", "Routine", "Plan", "Life", "Power", "Stability", 
    "Vibe", "Lifestyle", "Progress", "Stamina", "Flex", "Goals", "Physique", "Aesthetics"
] * 4

# ====== МОДИФИКАТОРЫ (ФОРМАТЫ, СИСТЕМЫ И СООБЩЕСТВА) ======
modifiers = [
    "Lab", "Studio", "HQ", "Club", "Hub", "Protocol", "Formula", "Blueprint", "System", 
    "Journey", "Challenge", "Guide", "Project", "Collective", "Secrets", "Hacks", "Zone", 
    "Diaries", "Nation", "Network", "Alliance", "Workshop", "Pro", "Elite", "Essentials", 
    "Method", "Care", "Academy", "Squad"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "by", "-", "x", "and"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # 1. Классический стиль Pinterest (напр. Sculpted Body, Toned Glow)
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # 2. Премиум / Экспертный стиль (напр. Vibrant Muscle Lab, Radiant Core System)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # 3. Стиль сообщества или системы (напр. Fitness Blueprint, Glow Secrets)
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # 4. Вирусный / современный стиль с коннекторами (напр. Healthy Physique & Radiant Energy)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 5. Биохакинг / ЗОЖ / Интерактив (напр. Toned Body x Glow)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # 6. Действие + Результат (напр. Strength & Beauty, Tone and Vitality)
        f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}"
    ]
    
    return random.choice(structures)

if __name__ == "__main__":
    # Тест: генерация 5 случайных вариантов
    for _ in range(15):
        print(generate_brand_name())