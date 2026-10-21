import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (ORNAMENTAL GARDEN) ======
adjectives = [
    "Blooming", "Flourishing", "Beautiful", "Lush", "Elegant",
    "Botanical", "Natural", "Vibrant", "Peaceful", "Serene",
    "Radiant", "Evergreen", "Colorful", "Graceful", "Charming",
    "Timeless", "Classic", "Modern", "Wild", "Organic",
    "Healthy", "Thriving", "Premium", "Inspired", "Magical",
    "Tranquil", "Dreamy", "Fresh", "Fragrant", "Abundant"
] * 4

# ====== СУЩЕСТВИТЕЛЬНЫЕ (FLOWERS / ORNAMENTAL PLANTS) ======
nouns = [
    "Garden", "Gardens",
    "FlowerGarden", "FlowerBeds",
    "Flowers", "Blooms", "Blossoms",

    "Landscape", "GardenDesign",
    "GardenDecor", "OutdoorLiving",

    "Perennials", "Annuals",
    "Roses", "Lavender", "Hydrangeas",
    "Peonies", "Wildflowers",

    "Herbs", "MedicinalPlants",
    "PollinatorGarden", "ButterflyGarden",

    "Greenery", "Nature", "Oasis",
    "Retreat", "Sanctuary",

    "Guide", "Tips", "Blueprint",
    "Academy", "Club", "Hub",
    "Studio", "World", "Journey"
] * 4

# ====== МОДИФИКАТОРЫ ======
modifiers = [
    "Pro", "Elite", "Lab", "HQ", "Club",
    "Academy", "Studio", "Works",
    "Blueprint", "Method",
    "Collective", "Hub", "Network"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "-", "x"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        f"{random.choice(adjectives)} {random.choice(nouns)}",
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",
        f"{random.choice(nouns)} {random.choice(modifiers)}",
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",
        f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",
    ]

    return random.choice(structures)

if __name__ == "__main__":
    print(generate_brand_name())