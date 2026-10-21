import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (PLANTS / GREENERY / NATURE) - 200+ ======
# Фокус на цвете, свежести и жизненной силе
adjectives = [
    "Green", "Verdant", "Lush", "Emerald", "Organic", "Natural", "Wild", "Pure",
    "Rooted", "Growing", "Fresh", "Living", "Botanical", "Earthy", "Vibrant", "Leafy",
    "Blooming", "Thriving", "Fertile", "Ancient", "Modern", "Simple", "Eternal", "Classic",
    "Serene", "Majestic", "Noble", "Radiant", "Infinite", "Quiet", "Secret", "Hidden",
    "Raw", "Prime", "Optimal", "Vital", "Healthy", "Eco", "Bio", "Clean", "Native",
    "Perennial", "Hardy", "Sustainable", "Bountiful", "Abundant", "Sprouting", "Flowering",
    "Aromatic", "Healing", "Deep", "Light", "Bright", "Soft", "Rustic", "Urban", "Homegrown"
] * 4

# ====== СУЩЕСТВИТЕЛЬНЫЕ (PLANTS / ELEMENTS / SPACES) - 200+ ======
# Универсальные слова, которые подходят и для семян, и для взрослых растений
nouns = [
    "Flora", "Leaf", "Plant", "Greenery", "Sprout", "Seed", "Root", "Bloom", "Foliage",
    "Garden", "Nature", "Earth", "Oasis", "Sanctuary", "Haven", "Plot", "Patch", "Meadow",
    "Grove", "Woods", "Forest", "Botany", "Botanics", "Life", "Origin", "Source", "Flow",
    "Element", "Concept", "Studio", "Gallery", "Archive", "Collective", "Hub", "Zone",
    "Empire", "Realm", "Dynamics", "Matrix", "Structure", "Form", "Texture", "Pattern",
    "Scene", "Landscape", "Harvest", "Petal", "Stem", "Herbs", "Greens", "Wildflowers"
] * 4

# ====== МОДИФИКАТОРЫ (Authority & Style) ======
modifiers = [
    "Pro", "Elite", "Lab", "HQ", "Club", "Nation", "Collective", "System",
    "Method", "Blueprint", "Academy", "Studio", "Works", "Network", "Formula",
    "Engine", "Protocol", "Framework", "Alliance", "Factory", "Hub", "Essentials",
    "Masters", "Project", "Source", "Ideas", "Tips", "Space", "Vibe", "Daily"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "by", "-", "x"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # 1. Лаконично и стильно (Emerald Leaf)
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # 2. Профессиональный бренд (Pure Flora Studio)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # 3. Сообщество/Система (Greenery Method)
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # 4. Эстетичный дуэт (Wild Roots & Fresh Blooms)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 5. Природа для чего-то (Natural Greenery for Living)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # 6. Коротко (Eco Sprout)
        f"{random.choice(adjectives)} {random.choice(nouns)}"
    ]

    return random.choice(structures)

# ====== ТЕСТ ======
if __name__ == "__main__":
    for _ in range(15):
        print(generate_brand_name())