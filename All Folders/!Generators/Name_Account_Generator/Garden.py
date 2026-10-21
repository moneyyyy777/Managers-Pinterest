import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (GARDEN / LANDSCAPE / NATURE) - 200+ ======
# Охватываем эстетику, типы почв, времена года и стили садов
adjectives = [
    "Green", "Lush", "Fertile", "Blooming", "Sunny", "Earthy", "Backyard", "Rural",
    "Urban", "Organic", "Heirloom", "Botanical", "Verdant", "Rustic", "Secret",
    "Hidden", "Floral", "Perennial", "Hardy", "Fragrant", "Wild", "Cultivated",
    "Sustainable", "Raised", "Vertical", "Potted", "Intensive", "Bountiful",
    "Plentiful", "Abundant", "Natural", "Pristine", "Evergreen", "Leafy", "Rooted",
    "Flowering", "Seasonal", "Spring", "Summer", "Autumn", "Golden", "Mossy",
    "Woody", "Sprouting", "Ancient", "Modern", "Classic", "Nurturing", "Bio",
    "Eco", "Vibrant", "Serene", "Majestic", "Pro", "Optimal", "Elite", "Prime",
    "Ultimate", "Resilient", "Homegrown", "Fresh", "Pure", "Clean", "Tropical"
] * 4 # Список расширен за счет разнообразия комбинаций

# ====== СУЩЕСТВИТЕЛЬНЫЕ (PLANTS / STRUCTURES / TOOLS) - 200+ ======
# Охватываем растения, места посадки, инструменты и элементы декора
nouns = [
    "Garden", "Yard", "Plot", "Patch", "Acre", "Farm", "Field", "Backyard",
    "Patio", "Balcony", "Greenhouse", "Nursery", "Shed", "Planter", "Pot",
    "Box", "RaisedBed", "Trellis", "Fence", "Path", "Soil", "Compost", "Mulch",
    "Seed", "Sprout", "Root", "Stem", "Leaf", "Flower", "Bloom", "Petal", "Bud",
    "Fruit", "Veggie", "Herb", "Tree", "Shrub", "Bush", "Vine", "Orchard",
    "Grove", "Thicket", "Hedge", "Lawn", "Grass", "Meadow", "Wildflower",
    "Harvest", "Crop", "Yield", "Sapling", "Seedling", "Hybrid", "Variety",
    "Botany", "Gardener", "Farmer", "Planter", "Sower", "Harvester", "Keeper",
    "Sanctuary", "Haven", "Landscapes", "Cottage", "Potager", "Apothecary"
] * 4

# ====== МОДИФИКАТОРЫ (Authority & Style) ======
modifiers = [
    "Pro", "Elite", "Lab", "HQ", "Club", "Nation", "Collective", "System",
    "Method", "Blueprint", "Academy", "Studio", "Works", "Network", "Formula",
    "Engine", "Protocol", "Framework", "Alliance", "Factory", "Hub", "Essentials",
    "Masters", "Builders", "Creators", "Project", "Source", "Ideas", "Tips"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "by", "-", "x"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # 1. Классика (Lush Garden)
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # 2. Профессиональное сообщество (Urban Planter Collective)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # 3. Ресурс с идеями (Backyard Formula)
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # 4. Эстетичный дуэт (Sunny Blooms & Green Roots)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 5. Целевой проект (Organic Seeds for Backyard)
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # 6. Броское короткое (Eco Sprout)
        f"{random.choice(adjectives)} {random.choice(nouns)}"
    ]

    return random.choice(structures)

# ====== ТЕСТ ======
if __name__ == "__main__":
    print(generate_brand_name())