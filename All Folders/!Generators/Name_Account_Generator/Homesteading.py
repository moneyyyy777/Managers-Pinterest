import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (HOMESTEADING) ======
adjectives = [
    "Simple", "Natural", "Sustainable", "Rural", "Country",
    "Homestead", "SelfSufficient", "Organic", "Traditional",
    "Rustic", "Independent", "Prepared", "Practical",
    "Wholesome", "Thriving", "Growing", "Abundant",
    "Healthy", "Backyard", "Modern", "Classic",
    "Peaceful", "Resourceful", "OffGrid", "Handmade",
    "Frugal", "Authentic", "Timeless", "Rooted",
    "Intentional", "EcoFriendly", "Resilient"
] * 4

# ====== СУЩЕСТВИТЕЛЬНЫЕ (HOMESTEADING CORE) ======
nouns = [
    "Homestead", "Homesteading",

    # Lifestyle
    "Living", "Lifestyle", "Journey",
    "Life", "WayOfLife",

    # Self Sufficiency
    "SelfReliance", "SelfSufficiency",
    "Preparedness", "Independence",

    # Property
    "Farm", "Farmstead", "Backyard",
    "Acreage", "Retreat",

    # Skills
    "Skills", "Knowledge", "Guide",
    "Blueprint", "Method", "System",

    # Food
    "Harvest", "Pantry", "Preservation",
    "Canning", "Fermentation",

    # Animals
    "Chickens", "Livestock",

    # Herbal / Natural
    "Herbs", "Remedies",
    "Wellness", "Nature",

    # Pinterest style
    "Club", "Hub", "Lab",
    "Academy", "World",
    "Community", "Network"
] * 4

# ====== МОДИФИКАТОРЫ ======
modifiers = [
    "Pro", "Elite", "Lab", "HQ",
    "Academy", "Club", "Works",
    "Blueprint", "Method", "Framework",
    "Collective", "Hub", "Network",
    "System", "Protocol"
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

        f"{random.choice(adjectives)} {random.choice(nouns)}"
    ]

    return random.choice(structures)

# ====== ТЕСТ ======
if __name__ == "__main__":
    print(generate_brand_name())