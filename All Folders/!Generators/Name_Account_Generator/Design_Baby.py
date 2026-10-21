import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (250+ штук: Baby, детская эстетика, дизайн, атмосфера) ======
adjectives = [
    # Baby / Kids эстетика
    "Sweet", "Cute", "Adorable", "Little", "Lovely", "Playful", "Whimsical",
    "Cheerful", "Joyful", "Gentle", "Soft", "Dreamy", "Charming", "Darling",
    "Tiny", "Tender", "Happy", "Cozy", "Warm", "Friendly", "Fun", "Magical",
    "Wonder", "Precious", "Sunny", "Smiley", "Bubbly", "Merry", "Bright",
    "Sweetly", "Lovely", "Darling", "Delightful", "Enchanting", "Fairytale",
    "Storybook", "Childlike", "Youthful", "Innocent", "Playful", "Heartfelt",

    # Универсальная design эстетика
    "Creative", "Artistic", "Modern", "Timeless", "Minimal", "Elegant",
    "Aesthetic", "Organic", "Natural", "Pastel", "Colorful", "Vivid",
    "Softened", "Delicate", "Dreamy", "Airy", "Light", "Fresh", "Clean",
    "Refined", "Polished", "Stylish", "Beautiful", "Expressive", "Imaginative",
    "Decorative", "Artful", "Curated", "Unique", "Original", "Inspired",
    "Modernist", "Contemporary", "Classic", "Simple", "Pure", "Balanced",
    "Harmonic", "Graceful", "Chic", "Lovely", "Radiant", "Luminous",

    # Цвета / мягкие оттенки
    "Blush", "Peach", "Cream", "Vanilla", "Honey", "Rose", "Berry", "Lilac",
    "Lavender", "Mint", "Sage", "Sky", "Azure", "Ivory", "Pearl", "Cloudy",
    "Misty", "Dusty", "Powder", "Coral", "Butter", "Lemon", "Apricot",
    "Caramel", "Cocoa", "Warm", "Sunny", "Golden", "Rainbow", "Pastel",
    "Muted", "Soft", "Light", "Creamy", "Rosy", "Peachy", "Milky", "Powdery",

    # Атмосфера
    "Magical", "Cosmic", "Celestial", "Stellar", "Dreamy", "Ethereal",
    "Peaceful", "Calm", "Serene", "Gentle", "Quiet", "Bright", "Radiant",
    "Joyful", "Hopeful", "Whimsical", "Playful", "Cozy", "Heartwarming",
    "Lively", "Cheerful", "Sunny", "Blissful", "Wonderous", "Enchanting",
    "Fairytale", "Storybook", "Nostalgic", "Sweet", "Tender", "Lovely",

    # Design / branding
    "Signature", "Premium", "Boutique", "Studio", "Curated", "Creative",
    "Visual", "Graphic", "Digital", "Decorative", "Artistic", "Crafted",
    "Handmade", "Thoughtful", "Intentional", "Distinctive", "Expressive",
    "Designer", "Aesthetic", "Editorial", "Modern", "Classic", "Essential",
    "Versatile", "Original", "Polished", "Professional", "Beautiful",
    "Inspired", "Imaginative", "Inventive", "Fresh", "Current", "Endless",
    "Limitless", "Dynamic", "Playful", "Artful", "Creative",

    # Дополнительные универсальные
    "Little", "Tiny", "Mini", "Pocket", "Small", "Young", "Kind", "Pure",
    "Gentle", "Soft", "Sweet", "Happy", "Bright", "Dreamy", "Magic",
    "Wonder", "Lovely", "Joyful", "Playful", "Cozy", "Warm", "Natural",
    "Organic", "Airy", "Colorful", "Delicate", "Tender", "Charming",
    "Darling", "Precious", "Adorable", "Cute", "Whimsical", "Cheerful"
]


# ====== СУЩЕСТВИТЕЛЬНЫЕ (250+ штук: Baby, дети, дизайн, творчество) ======
nouns = [
    # Baby / Kids — достаточно понятно направление
    "Baby", "Babies", "Little", "Kids", "Child", "Children", "Tiny",
    "Junior", "Nursery", "Playroom", "Play", "Family", "LittleOne",
    "Newborn", "Toddler", "Childhood", "Babyhood", "Kiddo", "LittleOnes",
    "TinyTales", "BabyWorld", "KidsWorld", "LittleWorld", "BabyLand",
    "Wonderland", "Playland", "Nursery", "Childhood", "Dreamland",

    # Design / Art
    "Design", "Art", "Ideas", "Studio", "Creations", "Lab", "Concepts",
    "House", "Works", "Hub", "Dreams", "Gallery", "Visions", "Collective",
    "Craft", "Muse", "Atelier", "Workshop", "Projects", "Inspiration",
    "Resources", "Elements", "Graphics", "Illustrations", "Artwork",
    "Visuals", "Prints", "Patterns", "Templates", "Assets", "Details",
    "Collections", "Editions", "Pieces", "Designs", "Creatives",

    # Baby-themed visual concepts
    "Bunny", "Bear", "Cloud", "Moon", "Star", "Rainbow", "Sun",
    "Bloom", "Petal", "Garden", "Meadow", "Forest", "Woodland",
    "Dream", "Dreams", "Tale", "Story", "Stories", "Wonder", "Magic",
    "Joy", "Smile", "Love", "Heart", "Hug", "Kiss", "Cuddle",
    "Snuggle", "Giggle", "Lullaby", "Whisper", "Wish", "Wishes",
    "Spark", "Glow", "Light", "Sky", "Clouds", "Sunshine",

    # Абстрактные design concepts
    "Canvas", "Palette", "Texture", "Pattern", "Shape", "Form", "Line",
    "Frame", "Scene", "Layer", "Element", "Detail", "Composition",
    "Layout", "Sketch", "Stroke", "Brush", "Color", "Hue", "Tone",
    "Shade", "Gradient", "Outline", "Icon", "Symbol", "Mark", "Motif",
    "Figure", "Object", "Visual", "Image", "Picture", "Scene", "Style",
    "Theme", "Concept", "Idea", "Vision", "Mood", "Vibe",

    # Archive / collection
    "Archive", "Diary", "Journal", "Magazine", "Edit", "Index", "Chronicle",
    "Log", "Catalogue", "Directory", "Folio", "Portfolio", "Moodboard",
    "Board", "Files", "Records", "Notes", "Pages", "Book", "Zine",
    "Library", "Collection", "Vault", "Shelf", "Album", "Edition",
    "Series", "Set", "Bundle", "Kit", "Box", "Chest", "Cabinet",

    # Пространства / брендинг
    "Corner", "House", "Room", "Place", "Space", "World", "Garden",
    "Haven", "Nest", "Studio", "Loft", "Atelier", "Workshop", "Market",
    "Boutique", "Gallery", "Shop", "Store", "Source", "Supply", "Base",
    "Center", "Point", "District", "Circle", "Society", "Club", "Guild",
    "Collective", "Community", "Network", "Project", "Department",

    # Дополнительная мягкая семантика
    "Nest", "Haven", "Meadow", "Garden", "Field", "Forest", "Woodland",
    "Willow", "Fern", "Leaf", "Branch", "Petal", "Bloom", "Rose",
    "Pearl", "Shell", "Cloud", "Rain", "Breeze", "Sunrise", "Sunset",
    "Moonlight", "Starlight", "Twilight", "Rainbow", "Aurora", "Sky",
    "Ocean", "River", "Lake", "Valley", "Hill", "Island", "Harbor",
    "Meadow", "Grove", "Path", "Trail", "Horizon", "Wonder"
]


# ====== МОДИФИКАТОРЫ (Суффиксы и префиксы) ======
modifiers_suffix = [
    "Co.", "Pro", "Club", "Factory", "Workshop", "HQ", "Network", "Inc",
    "Group", "Daily", "Supply", "Goods", "Lab", "Studios", "Creators",
    "Aesthetics", "Edits", "Division", "Society", "Space", "Room",
    "Bureau", "Agency", "Base", "Department", "Collective", "Partners",
    "Foundry", "Boutique", "Market",

    "Archive", "Studio", "Works", "Press", "Office", "Corner", "Store",
    "House", "Library", "Union", "System", "Guild", "Circle", "Project",
    "Edition", "Vault", "Center", "Point", "District", "Source", "Institute",
    "Company", "Gallery", "Residence", "Place", "Commons", "Atelier",

    # Baby / kids friendly
    "Kids", "Baby", "Little", "Junior", "Nursery", "Play", "Creative",
    "Designs", "Graphics", "Illustrations", "Prints", "Patterns",
    "Resources", "Studio", "Collection", "World", "House", "Corner"
]


modifiers_prefix = [
    "The", "Studio", "Project", "Maison", "Atelier", "House of", "Daily",
    "Visual", "Bureau of", "Dept.", "Modern", "Base", "Concept", "Curated",

    "North", "South", "East", "West", "Urban", "Sunday", "Monday",
    "Original", "True", "Pure", "Open", "Hidden", "Little", "Grand",
    "Local", "Found", "New", "Old", "Future", "Next", "First", "Second",
    "Collective", "Studio of", "House", "Office of", "Archive of",
    "Society of", "Circle of", "Guild of", "Curated", "Selected",
    "Essential", "Signature", "Private", "Public", "Parallel",
    "Beyond", "Inside", "Outer", "Inner", "Project", "Modern", "Minimal",

    # Baby / Kids
    "Little", "Baby", "Tiny", "Sweet", "Happy", "Playful", "Dear",
    "Lovely", "Darling", "Cute", "Mini", "Young", "Nursery",
    "Kids", "Childhood", "Baby", "Little One"
]


# ====== СЛОВА-АРХИВЫ ДЛЯ ОТДЕЛЬНОГО ПАТТЕРНА ======
archive_terms = [
    "Archive", "Diary", "Journal", "Edit", "Vault", "Magazine", "Index",
    "Log", "Chronicle", "Zine", "Moodboard", "Folio", "Supply", "Goods",
    "Collection", "Library", "Catalogue", "Studio", "Gallery", "Files",
    "Works", "Edition", "Portfolio", "Shelf", "Album", "Series",
    "Source", "Toolkit", "Resources", "Ideas"
]


# ====== СВЯЗКИ ======
connectors = ["&", "x", "+", "and", "-"]

connectors.extend([
    "|", "//", "•", "with", "meets", "vs", "into", "of", "for",
    "over", "under", "from", "via", "inside", "beyond", "between"
])


# ====== ГЕНЕРАТОР НАЗВАНИЙ ======
def generate_brand_name():
    """
    Генерирует универсальные названия брендов
    для Pinterest-аккаунтов в нише Baby Design.

    Названия достаточно явно связаны с baby / kids /
    nursery / creative design, но не привязаны к
    конкретному товару или подтематике.
    """

    patterns = [

        # 1. Прилагательное + Существительное
        # e.g. "Sweet Studio", "Little Design"
        lambda: f"{random.choice(adjectives)} {random.choice(nouns)}",

        # 2. Существительное + Архив
        # e.g. "Baby Archive", "Little Journal"
        lambda: f"{random.choice(nouns)} {random.choice(archive_terms)}",

        # 3. Префикс + Прилагательное + Существительное
        # e.g. "Little Dreamy Studio"
        lambda: f"{random.choice(modifiers_prefix)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 4. Прилагательное + Существительное + Суффикс
        # e.g. "Sweet Graphics Studio"
        lambda: f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers_suffix)}",

        # 5. Два существительных
        # e.g. "Baby Dreams", "Nursery Studio"
        lambda: f"{random.choice(nouns)} {random.choice(nouns)}",

        # 6. Существительное + Связка + Существительное
        # e.g. "Baby & Design", "Little x Art"
        lambda: f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # 7. Прилагательное + Существительное + Связка + Существительное
        # e.g. "Sweet Design & Art"
        lambda: f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # 8. Prefix + Noun
        # e.g. "Little Studio", "Baby Gallery"
        lambda: f"{random.choice(modifiers_prefix)} {random.choice(nouns)}",

        # 9. Adj + Adj + Noun
        # e.g. "Sweet Little Studio"
        lambda: f"{random.choice(adjectives)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 10. Noun + Suffix
        # e.g. "Baby Studio", "Little Works"
        lambda: f"{random.choice(nouns)} {random.choice(modifiers_suffix)}",

        # 11. Prefix + Noun + Suffix
        # e.g. "Little Baby Studio"
        lambda: f"{random.choice(modifiers_prefix)} {random.choice(nouns)} {random.choice(modifiers_suffix)}",

        # 12. Adj + Noun + Noun
        # e.g. "Sweet Baby Design"
        lambda: f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(nouns)}",

        # 13. Noun + Connector + Adj + Noun
        # e.g. "Baby & Creative Studio"
        lambda: f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # 14. Adj + Noun + Archive
        # e.g. "Sweet Baby Archive"
        lambda: f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(archive_terms)}",

        # 15. Archive + Noun
        # e.g. "Little Archive"
        lambda: f"{random.choice(archive_terms)} {random.choice(nouns)}",

        # 16. Adj + Archive + Noun
        # e.g. "Sweet Archive Baby"
        lambda: f"{random.choice(adjectives)} {random.choice(archive_terms)} {random.choice(nouns)}"
    ]

    name = random.choice(patterns)()

    # ====== ЗАЩИТА ОТ ДУБЛИРОВАНИЯ СЛОВ ======
    words_clean = [
        w.lower()
        for w in name
        .replace("&", "")
        .replace("+", "")
        .replace("x", "")
        .replace("-", "")
        .replace("|", "")
        .replace("//", "")
        .split()
    ]

    words_clean = [w for w in words_clean if w]

    if len(words_clean) != len(set(words_clean)):
        return generate_brand_name()

    return name


# ====== ТЕСТОВАЯ ГЕНЕРАЦИЯ ======
if __name__ == "__main__":
    print("=== УНИВЕРСАЛЬНЫЕ НАЗВАНИЯ ДЛЯ BABY DESIGN PINTEREST ===")
    print("-" * 60)

    for _ in range(30):
        name = generate_brand_name()

        # Генерация юзернейма для авторегера
        username = (
            name
            .replace(" ", "")
            .replace("&", "and")
            .replace(".", "")
            .replace("+", "and")
            .replace("-", "")
            .replace("|", "")
            .replace("/", "")
            .lower()
        )

        print(f"{name:<40} | @{username}")