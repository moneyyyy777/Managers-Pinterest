import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (GARDEN / HERBAL / MEDICINAL) - 200+ ======
adjectives = [
    "Green", "Herbal", "Medicinal", "Natural", "Organic", "Healing", "Vital", "Wild", 
    "Botanical", "Rooted", "Ancient", "Pure", "Holistic", "Backyard", "Lush", "Fertile",
    "SelfSufficient", "Sustainable", "Potent", "Rare", "Essential", "Living", "Traditional",
    "Fresh", "Dried", "Therapeutic", "Secret", "Golden", "Blooming", "Fruitful", "Elite",
    "Prime", "Ultimate", "Healthy", "Primal", "Native", "Earthly", "Mystic", "Wise", "Aromatic",
    "Heirloom", "NonGMO", "Resilient", "OffGrid", "Modern", "Classic", "Rustic", "Nurturing",
    "Ancestral", "Bio", "Eco", "Vibrant", "Serene", "Majestic", "Pro", "Expert", "Optimal"
] * 4  # Умножаем для веса, всего более 200 элементов

# ====== СУЩЕСТВИТЕЛЬНЫЕ (GARDEN / APOTHECARY / HOMESTEAD) - 200+ ======
nouns = [
    "Garden", "Herbs", "Plants", "Seeds", "Apothecary", "Remedy", "Homestead", "Farm",
    "Pharmacy", "Sanctuary", "Lab", "Hub", "Zone", "Roots", "Sprout", "Harvest", 
    "Bloom", "Tincture", "Medicine", "Nature", "Backyard", "Flora", "Botanics", "Cures",
    "Solutions", "Blueprint", "System", "Method", "Guide", "Secrets", "Mastery", "Haven",
    "Patch", "Plot", "Acre", "Fields", "Meadow", "Cottage", "Apothecary", "Salves", 
    "Teas", "Tonics", "Elixirs", "Wisdom", "Lifestyle", "Academy", "Path", "Culture",
    "Greenhouse", "Soil", "Nursery", "Collective", "Empire", "Matrix", "Flow", "Origin"
] * 4 # Умножаем для веса, всего более 200 элементов

# ====== МОДИФИКАТОРЫ (50+) ======
modifiers = [
    "Pro", "Elite", "Lab", "HQ", "Club", "Nation", "Collective", "System", 
    "Method", "Blueprint", "Academy", "Studio", "Works", "Network", "Formula", 
    "Engine", "Protocol", "Framework", "Alliance", "Factory", "Hub", "Essentials",
    "Pro", "Experts", "Masters", "Builders", "Creators", "Project", "Source"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "by", "-", "x"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # 1. Лаконичный экспертный стиль (Green Herbs)
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # 2. Брендовый премиум стиль (Medicinal Garden Lab)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # 3. Стиль "Система/Метод" (Herb Protocol)
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # 4. Двойное название (эстетика Pinterest) (Wild Seeds & Healing Herbs)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 5. Интент-ориентированный (Natural Medicine for Homestead)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # 6. Короткий броский (Bio Sprout)
        f"{random.choice(adjectives)} {random.choice(nouns)}"
    ]

    return random.choice(structures)

# ====== ТЕСТ (Генерация 10 примеров) ======
if __name__ == "__main__":
    print(generate_brand_name())