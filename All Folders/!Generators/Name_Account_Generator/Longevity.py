import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (УНИВЕРСАЛЬНЫЙ ANTI-AGING / BIOHACKING) ======
adjectives = [
    "Ageless", "Timeless", "Youthful", "Vital", "Vibrant", "Radiant", "Optimal", "Prime", 
    "Active", "Resilient", "Strong", "Cellular", "Holistic", "Natural", "Pure", "Renewed", 
    "Infinite", "Golden", "Balanced", "Healthy", "Ethereal", "Bio", "Smart", "Wise", 
    "Deep", "Essential", "Ultimate", "Regenerative", "Light", "Daily", "Flawless", "Healing", 
    "Inner", "Noble", "Cosmic", "Refreshed", "Clear", "Organic", "Constant", "Lifelong"
] * 4

# ====== СУЩЕСТВИТЕЛЬНЫЕ (КЛЕТКИ / ОМОЛОЖЕНИЕ / СИЛА / ДОЛГОЛЕТИЕ) ======
nouns = [
    "Longevity", "Vitality", "Youth", "Age", "Healthspan", "Lifespan", "Health", "Wellness", 
    "Energy", "Body", "Cells", "Muscle", "Strength", "Biohacking", "Regeneration", "Autophagy", 
    "Sarcopenia", "Fasting", "Vibe", "Blueprint", "Remedy", "Therapy", "Routine", "Life", 
    "Grace", "Aura", "Balance", "Purity", "Harmony", "Flow", "Stamina", "Mito", "Core", 
    "Focus", "Years"
] * 4

# ====== МОДИФИКАТОРЫ (ФОРМАТЫ, СИСТЕМЫ И СООБЩЕСТВА) ======
modifiers = [
    "Lab", "Studio", "HQ", "Club", "Hub", "Protocol", "Formula", "Blueprint", "System", 
    "Journey", "Challenge", "Guide", "Project", "Collective", "Secrets", "Hacks", "Zone", 
    "Diaries", "Nation", "Network", "Alliance", "Workshop", "Masters", "Group", "Pro", 
    "Elite", "Essentials", "Naturals", "Care", "Method"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "by", "-", "x", "and"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # 1. Классический стиль Pinterest (напр. Ageless Youth, Radiant Vitality)
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # 2. Премиум / Экспертный стиль (напр. Optimal Cells Lab, Regenerative Body Protocol)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # 3. Стиль сообщества или системы (напр. Longevity Blueprint, Autophagy Secrets)
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # 4. Вирусный / современный стиль с коннекторами (напр. Timeless Body & Youthful Energy)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 5. Биохакинг / ЗОЖ (напр. Pure Health x Longevity)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # 6. Действие + Результат (напр. Lifespan & Vitality, Strength & Grace)
        f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}"
    ]
    
    return random.choice(structures)

if __name__ == "__main__":
    # Генерация 10 случайных вариантов для теста
    for _ in range(10):
        print(generate_brand_name())