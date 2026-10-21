import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (SMOOTHIE / FRUIT / TASTY) ======
adjectives = [
    "Tropical", "Fruity", "Fresh", "Berry", "Juicy", "Sweet", "Blended", 
    "Green", "Thick", "Creamy", "Frozen", "Frosty", "Healthy", "Yummy", 
    "Delicious", "Vibrant", "Chill", "Tasty", "Pure", "Sunny", "Super", 
    "Daily", "Raw", "Bright", "Vital", "Refreshing", "Glow", "Nutty"
] * 4

# ====== СУЩЕСТВИТЕЛЬНЫЕ (СМУЗИ / НАПИТКИ / ФРУКТЫ) ======
nouns = [
    "Smoothie", "Blend", "Bowl", "Fruit", "Sip", "Shake", "Mix", "Cup", 
    "Nectar", "Splash", "Oasis", "Greens", "Mango", "Banana", "Crush", 
    "Recipe", "Drop", "Juice", "Glow", "Bite", "Harvest", "Breakfast", 
    "Glass", "Flavor", "Magic"
] * 4

# ====== МОДИФИКАТОРЫ (ФОРМАТЫ И ЭСТЕТИКА) ======
modifiers = [
    "Bar", "Shop", "Lab", "Recipes", "Diaries", "Club", "Hub", "Daily", 
    "Maker", "Stand", "Studio", "Nation", "Squad", "Guide", "Project", 
    "Life", "Girls", "Hacks", "Station", "Cart", "Vibes", "Lovers", 
    "Creations", "Menu", "Eats"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "by", "-", "x", "and"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # 1. Классический стиль Pinterest (напр. Tropical Smoothie, Fresh Blend)
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # 2. Премиум / Локальный стиль (напр. Frozen Bowl Bar, Berry Shake Lab)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # 3. Стиль сообщества или блога (напр. Smoothie Recipes, Blend Diaries)
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # 4. Двойной эстетичный (напр. Fresh Sip & Green Bowl)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 5. Креативный (напр. Creamy Blend x Smoothie)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # 6. Действие + Результат / Комбо (напр. Blend & Sip, Fruit & Mix)
        f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}"
    ]
    
    return random.choice(structures)

# ====== ТЕСТ ======
if __name__ == "__main__":
    print(generate_brand_name())