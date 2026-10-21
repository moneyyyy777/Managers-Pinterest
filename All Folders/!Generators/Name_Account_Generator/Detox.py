import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (УНИВЕРСАЛЬНЫЙ DETOX / WELLNESS) ======
adjectives = [
    "Pure", "Clean", "Green", "Fresh", "Glowing", "Slim", "Flat", "Healthy",
    "Natural", "Raw", "Organic", "Vital", "Clear", "Lean", "Active",
    "Balanced", "Renewed", "Refreshed", "Light", "Swift", "Quick", "Daily",
    "Radiant", "Holistic", "Vibrant", "Healing", "Flawless", "Ultimate",
    "Simple", "Easy", "Mindful", "ToxinFree", "Herbal", "Inner", "Deep", 
    "Complete", "Gentle", "Total", "Cellular", "Zen", "Essential"
] * 4

# ====== СУЩЕСТВИТЕЛЬНЫЕ (ОЧИЩЕНИЕ / ОРГАНИЗМ / ЗДОРОВЬЕ) ======
nouns = [
    "Detox", "Cleanse", "Flush", "Belly", "Gut", "Reset", "Glow", "Water", 
    "Diet", "Body", "Health", "Tummy", "Habit", "Routine", "Plan", "Life", 
    "Wellness", "Vibe", "Energy", "Metabolism", "Nutrition", "Clean", 
    "Shape", "Digest", "Weight", "Care", "Vitality", "Aura", "Balance", 
    "Purity", "Remedy", "Cure", "Therapy", "Harmony"
] * 4

# ====== МОДИФИКАТОРЫ (ФОРМАТЫ И СООБЩЕСТВА) ======
modifiers = [
    "Plan", "Routine", "System", "Daily", "Hub", "Lab", "Method", "Blueprint",
    "Club", "Formula", "Protocol", "Journey", "Challenge", "Guide", "Project",
    "HQ", "Studio", "Collective", "Secrets", "Hacks", "Zone", "Diaries",
    "Life", "Girls", "Women", "Remedies", "Essentials", "Naturals", 
    "Botanicals", "Care"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "by", "-", "x", "and"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # 1. Классический стиль Pinterest (напр. Pure Detox, Inner Cleanse)
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # 2. Премиум / Экспертный стиль (напр. Lean Cleanse System, Deep Reset Lab)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # 3. Стиль сообщества или системы (напр. Detox Secrets, Gut Blueprint)
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # 4. Вирусный / современный стиль с коннекторами (напр. Fresh Glow & Slim Belly)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 5. Биохакинг / ЗОЖ (напр. Clean Flush x Detox)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # 6. Действие + Результат (напр. Flush & Reset, Care & Glow)
        f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}"
    ]
    
    return random.choice(structures)

if __name__ == "__main__":
    print(generate_brand_name())