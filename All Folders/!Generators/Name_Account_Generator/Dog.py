import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (DOG NICHE) ======
adjectives = [
    "Happy", "Smart", "Loyal", "Playful", "Healthy", "Fluffy", "Cute",
    "Brave", "Gentle", "Friendly", "Active", "Calm", "Trained",
    "Balanced", "Strong", "Wild", "Cozy", "Premium", "Ultimate",
    "Modern", "Daily", "Trusted", "Expert", "Pro", "Elite",
    "Perfect", "Adorable", "Tiny", "Big", "Energetic",
    "WellBehaved", "Obedient", "Social", "Confident"
] * 4

# ====== СУЩЕСТВИТЕЛЬНЫЕ (DOG NICHE CORE) ======
nouns = [
    "Dog", "Puppy", "Dogs", "Pups",
    "Training", "Care", "Life", "Lifestyle",
    "Habits", "Routine", "Guide", "System",
    "Method", "Blueprint", "Plan",
    "Academy", "School", "Club", "World",
    "Zone", "Hub", "Lab", "Home",
    "Family", "Journey", "Tips",
    "Behavior", "Obedience", "Skills",
    "Nutrition", "Health", "Wellness",
    "Playtime", "Bond", "Connection",
    "Companion", "Pack", "Trainer"
] * 4

# ====== МОДИФИКАТОРЫ ======
modifiers = [
    "Pro", "Elite", "Lab", "HQ", "Club",
    "Academy", "Studio", "Works",
    "System", "Method", "Blueprint",
    "Framework", "Network",
    "Formula", "Protocol",
    "Collective", "Nation", "Hub"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "by", "-", "x"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # 1. Pinterest style
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # 2. Premium / product vibe
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # 3. Authority (лучше всего для affiliate)
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # 4. Viral combo
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 5. Training / system vibe (очень конвертит)
        f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # 6. Short catchy
        f"{random.choice(adjectives)} {random.choice(nouns)}"
    ]

    return random.choice(structures)

# ====== ТЕСТ ======
if __name__ == "__main__":
    print(generate_brand_name())