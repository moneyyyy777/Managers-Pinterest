import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (HEALTH / FITNESS) ======
adjectives = [
    "Healthy", "Fit", "Lean", "Strong", "Active", "Balanced", "Clean", "Natural",
    "Vital", "Energized", "Radiant", "Mindful", "Optimal", "Smart", "Pure",
    "Powerful", "Dynamic", "Holistic", "Focused", "Disciplined", "Sustainable",
    "Fresh", "Light", "Advanced", "Prime", "Elevated", "Peak", "Core",
    "HighPerformance", "Bio", "Metabolic", "Slim", "Shredded", "Athletic",
    "Wellness", "Daily", "Ultimate", "NextGen", "Total", "Modern"
] * 4

# ====== СУЩЕСТВИТЕЛЬНЫЕ ======
nouns = [
    "Health", "Fitness", "Wellness", "Body", "Life", "Lifestyle",
    "Nutrition", "Fuel", "Energy", "Balance", "Habits", "Routine",
    "System", "Method", "Lab", "Hub", "Zone", "Flow",
    "Transformation", "Journey", "Program", "Blueprint", "Plan",
    "Solutions", "Results", "Performance", "Optimization",
    "Biohacking", "Metabolism", "Burn", "Shape", "Form",
    "Mind", "Discipline", "Power", "Fuel", "Core", "Reset"
] * 4

# ====== МОДИФИКАТОРЫ ======
modifiers = [
    "Pro", "Elite", "Lab", "HQ", "Club", "Nation",
    "Collective", "System", "Method", "Blueprint",
    "Academy", "Studio", "Works", "Network",
    "Formula", "Engine", "Protocol", "Framework",
    "Alliance", "Factory", "Hub"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "by", "-", "x"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # 1. Classic Pinterest style
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # 2. Premium brand feel
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # 3. Authority / system style (очень хорошо для affiliate)
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # 4. Viral / modern
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 5. Biohacking / high-ticket vibe
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # 6. Short catchy
        f"{random.choice(adjectives)} {random.choice(nouns)}"
    ]

    return random.choice(structures)

# ====== ТЕСТ ======
if __name__ == "__main__":
    print(generate_brand_name())