import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (HERBALISM) ======
adjectives = [
    "Herbal", "Natural", "Healing", "Botanical", "Wild",
    "Organic", "Holistic", "Medicinal", "Ancient", "Traditional",
    "Pure", "Wholesome", "Green", "Rooted", "Healthy",
    "Flourishing", "Thriving", "Nourishing", "Balanced",
    "Sacred", "Peaceful", "Heritage", "Seasonal", "Wildcrafted",
    "Handcrafted", "Timeless", "Gentle", "Holistic",
    "PlantBased", "Earthy", "Wellness", "Vital"
] * 4

# ====== СУЩЕСТВИТЕЛЬНЫЕ (HERBALISM CORE) ======
nouns = [
    "Herbalism", "Herbs", "Remedies", "Apothecary",
    "PlantMedicine", "Healing", "Wellness", "Tea",
    "Tinctures", "Salves", "Infusions", "Botanicals",

    "Garden", "HerbGarden", "Foraging", "Wildcrafting",
    "Nature", "Roots", "Leaves", "Flowers",

    "Guide", "Method", "Blueprint", "System",
    "Academy", "School", "Club", "World",
    "Hub", "Lab", "Studio", "Journey",

    "Wisdom", "Traditions", "Knowledge",
    "Lifestyle", "Living", "Health",
    "RemedyBook", "MateriaMedica"
] * 4

# ====== МОДИФИКАТОРЫ ======
modifiers = [
    "Pro", "Elite", "Lab", "Club",
    "Academy", "Studio", "Works",
    "Blueprint", "Method", "System",
    "Framework", "Collective",
    "Network", "Hub"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "-", "x"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # Pinterest style
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # Premium brand
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # Authority
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # Viral combo
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # Educational style
        f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # Short catchy
        f"{random.choice(adjectives)} {random.choice(nouns)}"
    ]

    return random.choice(structures)

# ====== ТЕСТ ======
if __name__ == "__main__":
    # Выведем 10 случайных имен для проверки генерации
    print("Примеры сгенерированных имен аккаунтов (Антистресс без негатива):")
    for _ in range(10):
        print(f"- {generate_brand_name()}")