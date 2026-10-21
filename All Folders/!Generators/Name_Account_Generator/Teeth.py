import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (УХОД ЗА ЗУБАМИ / ЭСТЕТИКА / БЕЛИЗНА) ======
adjectives = [
    "White", "Bright", "Pearl", "Pearly", "Perfect", "Healthy", "Clean", 
    "Glowing", "Radiant", "Fresh", "Natural", "Minty", "Crystal", "Flawless", 
    "Gentle", "Pure", "Shiny", "Strong", "Beautiful", "Magic", "Holistic", 
    "Organic", "Aesthetic", "Dazzling", "Mint", "Daily", "Vital", "Clear",
    "Confident", "Luminous", "Pristine", "Sweet", "Herbal", "Safe"
] * 4

# ====== СУЩЕСТВИТЕЛЬНЫЕ (ЗУБЫ / УЛЫБКА / ЗДОРОВЬЕ) ======
nouns = [
    "Teeth", "Smile", "Enamel", "Gums", "Breath", "Care", "Hygiene", 
    "Mouth", "Dental", "Bite", "Glow", "Whites", "Routine", "Health", 
    "Remedy", "Wellness", "Dentistry", "Habit", "Therapy", "Purity", 
    "Balance", "Cure", "Remedies", "Freshness", "Detox"
] * 4

# ====== МОДИФИКАТОРЫ (ФОРМАТЫ, ЛАЙФХАКИ И СООБЩЕСТВА) ======
modifiers = [
    "Hacks", "Secrets", "Routine", "Club", "Lab", "Studio", "Guide", 
    "Tips", "Daily", "Pro", "Aesthetics", "System", "Journey", "Collective", 
    "HQ", "Zone", "Diaries", "Essentials", "Naturals", "Care", "Vibes",
    "Goals", "Plan", "Project", "Girls", "Women", "Method", "Formula"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "by", "-", "x", "and"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # 1. Классический эстетичный стиль (напр. Bright Smile, White Teeth)
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # 2. Экспертный/брендовый стиль (напр. Perfect Smile Lab, Natural Teeth Secrets)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # 3. Стиль лайфхаков и сообщества (напр. Smile Hacks, Teeth Diaries)
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # 4. Длинный SEO-формат (напр. White Teeth & Fresh Breath)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 5. Стильный / современный (напр. Crystal Glow x Dental)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # 6. Действие + Результат (напр. Health & Glow, Care and Smile)
        f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}"
    ]
    
    return random.choice(structures)

# ====== ТЕСТ ======
if __name__ == "__main__":
    # Генерируем 10 вариантов для наглядности
    for _ in range(10):
        print(generate_brand_name())