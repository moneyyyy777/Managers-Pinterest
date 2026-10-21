import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (250+ штук: Эстетика, атмосфера, цвета, стили) ======
adjectives = [
    # Трендовая эстетика
    "Creative", "Elegant", "Modern", "Timeless", "Minimal", "Vivid", "Whimsical", 
    "Chic", "Playful", "Sleek", "Radiant", "Abstract", "Organic", "Harmonic", 
    "Ethereal", "Pristine", "Magnetic", "Vibrant", "Rustic", "Pastel", "Cozy",
    "Boho", "Scandi", "Nordic", "Japandi", "Moody", "Airy", "Aesthetic", 
    "Vintage", "Retro", "Dreamy", "Tactile", "Curated", "Bespoke", "Artisan",
    # Цвета, свет и материалы
    "Golden", "Blush", "Velvet", "Marble", "Wooden", "Silk", "Linen", "Ceramic",
    "Sunlit", "Glowing", "Luminous", "Lush", "Crisp", "Raw", "Refined", "Opaque",
    "Lucid", "Gilded", "Chromatic", "Holographic", "Neon", "Matte", "Glossy",
    "Muted", "Monochrome", "Vivid", "Pastel", "Inky", "Painted", "Fluid",
    # Эмоции и формы
    "Sweet", "Joyful", "Wild", "Magic", "Epic", "Noble", "Primal", "Cosmic", 
    "Infinite", "Elevated", "Inspired", "Mindful", "Conscious", "Stellar", 
    "Geometric", "Symmetric", "Asymmetric", "Curved", "Linear", "Essential", 
    "Daily", "Pure", "Hidden", "Secret", "Quiet", "Loud", "Nomadic", "Zen"
]

adjectives.extend([
    "Ambient","Analog","Architectural","Artful","Balanced","Blooming","Bold",
    "Bright","Calm","Captured","Celestial","Classic","Clean","Cloudy",
    "Collected","Colorful","Contemporary","Cool","Crafted","Crystal",
    "Delicate","Detailed","Dim","Distinct","Earthy","Effortless","Electric",
    "Ember","Emerald","Endless","Essential","Expressive","Feathered",
    "Fine","Floating","Fresh","Frosted","Gentle","Glass","Graceful",
    "Graphic","Handmade","Honest","Iconic","Illuminated","Immersive",
    "Indigo","Intentional","Ivory","Layered","Lightweight","Liquid",
    "Local","Natural","Neutral","Open","Peaceful","Perfect","Polished",
    "Powder","Quiet","Rare","Rich","Rose","Sand","Satin","Serene",
    "Soft","Solid","Stone","Subtle","Sunny","Terra","Textured","Transparent",
    "True","Urban","Velour","Warm","Weightless","White","Wildflower",
    "Woven","Azure","Amber","Berry","Cocoa","Copper","Cream","Dusty",
    "Forest","Honey","Ice","Lilac","Mint","Misty","Olive","Peach",
    "Pearl","Rosewood","Sage","Sky","Slate","Smoke","Snow","Terracotta",
    "Vanilla","Willow","Woodland","Artistic","Elegant","Refined","Sophisticated",
    "Premium","Luxury","Signature","Studio","Boutique","Curious","Inspired",
    "Infinite","Limitless","Dynamic","Creative","Expressive","Reflective",
    "Balanced","Modernist","Future","Classic","Heritage","Authentic",
    "Editorial","Curious","Experimental","Narrative","Poetic","Quietly",
    "Radiant","Lively","Softened","Minimalist","Decorative","Essentialist"
])

# Увеличим массив для масштаба комбинаций
adjectives.extend(["Digital", "Visual", "Optic", "Focal", "Sonic", "Dynamic", "Static", "Kinetic", "Astral", "Lunar", "Solar", "Wander", "Nomad"])

# ====== СУЩЕСТВИТЕЛЬНЫЕ (250+ штук: Концепции, элементы, природа, арт) ======
nouns = [
    # Арт и дизайн-концепции (Универсально)
    "Design", "Art", "Ideas", "Studio", "Creations", "Lab", "Concepts", "House", 
    "Forge", "Works", "Hub", "Dreams", "Solutions", "Gallery", "Visions", 
    "Collective", "Innovations", "Empire", "Muse", "Craft", "Edge", "Matrix",
    # Элементы графики (Без привязки к формату файла)
    "Canvas", "Spectrum", "Motion", "Form", "Texture", "Pattern", "Line", "Frame", 
    "Scene", "Pixel", "Ink", "Stroke", "Icon", "Shape", "Layer", "Structure",
    "Grid", "Type", "Typography", "Palette", "Chroma", "Hue", "Shade",
    "Gradient", "Layout", "Draft", "Sketch", "Vector", "Glyph", "Margin", "Node",
    # Природа и атмосфера (Идеально абстрактно для свадеб, детей, крафта)
    "Flora", "Bloom", "Petal", "Aura", "Prism", "Lens", "Focus", "Trace", "Relic",
    "Tale", "Pulse", "Rhythm", "Echo", "Wave", "Flow", "Dawn", "Dusk", "Horizon",
    "Root", "Shadow", "Light", "Glow", "Spark", "Space", "Vibe", "Mood",
    "Atmosphere", "Sanctuary", "Haven", "Habitat", "Moon", "Stars", "Cloud",
    # Тренды архивации (Популярно в Pinterest)
    "Archive", "Diary", "Journal", "Magazine", "Edit", "Index", "Chronicle", 
    "Log", "Catalogue", "Directory", "Folio", "Portfolio", "Vision", "Moodboard", 
    "Board", "Files", "Records", "Notes", "Pages", "Book", "Zine"
]

nouns.extend([
    "Avenue","Balance","Beacon","Blend","Block","Blueprint","Branch",
    "Bridge","Brush","Cabinet","Circle","Collection","Corner","Core",
    "Cornerstone","Current","Curve","Dimension","Direction","District",
    "Element","Estate","Field","Figure","Foundation","Garden","Gate",
    "Ground","Harbor","Hill","Island","Journey","Key","Kingdom","Library",
    "Loft","Loop","Map","Memory","Method","Mirror","Moment","Mountain",
    "Object","Office","Origin","Path","Peak","Perspective","Place",
    "Point","Portal","Process","Project","Realm","Reserve","River",
    "Route","Scale","Section","Sequence","Shelf","Signal","Source",
    "Spring","Square","Story","Studio","Summit","Surface","System",
    "Terrace","Theme","Thread","Tower","Trail","Universe","Valley",
    "View","Village","Visionary","Workshop","World","Yard","Zone",
    "Album","Album","Backdrop","Badge","Banner","Blueprint","Bundle",
    "Card","Catalog","Chapter","Circle","Collection","Composition",
    "Corner","Edition","Episode","Essence","File","Folder","Formula",
    "Gallery","Guide","Inspiration","Journey","Kit","Manual","Model",
    "Notebook","Package","Piece","Pin","Pinboard","Plan","Poster",
    "Preset","Profile","Project","Resource","Scene","Series","Set",
    "Shelf","Snapshot","Source","Style","Template","Toolkit","Treasure",
    "Universe","Vault","Visual","Workbook","Workshop","Workspace",
    "Studio","Nest","Forest","Garden","Meadow","River","Ocean","Coast",
    "Harbor","Lagoon","Lagoon","Bay","Field","Peak","Stone","Crystal",
    "Branch","Leaf","Seed","Petal","Flower","Fern","Palm","Shell",
    "Pearl","Coral","Drift","Mist","Rain","Storm","Breeze","Wind",
    "Sunrise","Sunset","Morning","Evening","Twilight","Aurora"
])

# ====== МОДИФИКАТОРЫ (Суффиксы и префиксы) ======
modifiers_suffix = [
    "Co.", "Pro", "Club", "Factory", "Workshop", "HQ", "Network", "Inc", "Group", 
    "Daily", "Supply", "Goods", "Lab", "Studios", "Creators", "Aesthetics", "Edits", 
    "Division", "Syndicate", "Society", "Space", "Room", "Bureau", "Agency", 
    "Base", "Department", "Collective", "Partners", "Foundry", "Boutique", "Market"
]

modifiers_suffix.extend([
    "Archive","Studio","Works","Collective","Press","Office","Corner",
    "Store","House","Archive","Library","Union","Network","System",
    "Guild","Circle","Project","Edition","Vault","Corner","Center",
    "Point","District","Supply","Craft","World","Source","Lab",
    "Institute","Company","Company.","Partners","Gallery","Society",
    "Union","Residence","Place","Commons","Institute","Atelier"
])

modifiers_prefix = [
    "The", "Studio", "Project", "Maison", "Atelier", "House of", "Daily", 
    "Visual", "Bureau of", "Dept.", "Modern", "Base", "Concept", "Curated"
]

modifiers_prefix.extend([
    "North","South","East","West","Urban","Daily","Sunday","Monday",
    "Original","True","Pure","Open","Hidden","Little","Grand",
    "Local","Found","New","Old","Future","Next","First","Second",
    "Collective","Studio of","House","Office of","Archive of",
    "Society of","Circle of","Guild of","Curated","Selected",
    "Essential","Signature","Private","Public","Parallel",
    "Beyond","Inside","Outer","Inner","Project","Modern","Minimal"
])

# Слова-архивы для отдельного паттерна
archive_terms = [
    "Archive", "Diary", "Journal", "Edit", "Vault", "Magazine", "Index", 
    "Log", "Chronicle", "Zine", "Moodboard", "Folio", "Supply", "Goods"
]

connectors = ["&", "x", "+", "and", "-"]

connectors.extend([
    "|","//","•","with","meets","meets","vs","into","of","for",
    "over","under","from","via","inside","beyond","between"
])

def generate_brand_name():
    """
    Генерирует абсолютно универсальные, абстрактные названия брендов,
    которые подходят для продажи любых цифровых товаров.
    """
    patterns = [
        # 1. Прилагательное + Существительное (e.g. "Velvet Grid")
        lambda: f"{random.choice(adjectives)} {random.choice(nouns)}",
        
        # 2. Существительное + Архив/Склад (e.g. "Texture Chronicle", "Ink Supply")
        lambda: f"{random.choice(nouns)} {random.choice(archive_terms)}",
        
        # 3. Префикс + Прилагательное + Существительное (e.g. "Atelier Lucid Form")
        lambda: f"{random.choice(modifiers_prefix)} {random.choice(adjectives)} {random.choice(nouns)}",
        
        # 4. Прилагательное + Существительное + Суффикс (e.g. "Fluid Type Foundry")
        lambda: f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers_suffix)}",
        
        # 5. Два существительных (e.g. "Prism Hue")
        lambda: f"{random.choice(nouns)} {random.choice(nouns)}",
        
        # 6. Существительное + Связка + Существительное (e.g. "Light & Space", "Ink x Bloom")
        lambda: f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",
        
        # 7. Прилагательное + Существительное + Связка + Существительное (e.g. "Minimal Art & Craft")
        lambda: f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

                # Prefix + Noun
        lambda: f"{random.choice(modifiers_prefix)} {random.choice(nouns)}",

        # Adj + Adj + Noun
        lambda: f"{random.choice(adjectives)} {random.choice(adjectives)} {random.choice(nouns)}",

        # Noun + Suffix
        lambda: f"{random.choice(nouns)} {random.choice(modifiers_suffix)}",

        # Prefix + Noun + Suffix
        lambda: f"{random.choice(modifiers_prefix)} {random.choice(nouns)} {random.choice(modifiers_suffix)}",

        # Adj + Noun + Noun
        lambda: f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(nouns)}",

        # Noun + Connector + Adj + Noun
        lambda: f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # Adj + Noun + Archive
        lambda: f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(archive_terms)}",

        # Archive + Noun
        lambda: f"{random.choice(archive_terms)} {random.choice(nouns)}",

        # Adj + Archive + Noun
        lambda: f"{random.choice(adjectives)} {random.choice(archive_terms)} {random.choice(nouns)}"
    ]
    
    name = random.choice(patterns)()
    
    # Защита от дублирования слов
    words_clean = [w.lower() for w in name.replace("&", "").replace("+", "").replace("x", "").replace("-", "").split()]
    words_clean = [w for w in words_clean if w] 
    
    if len(words_clean) != len(set(words_clean)):
        return generate_brand_name() 
        
    return name

# ====== ТЕСТОВАЯ ГЕНЕРАЦИЯ ======
if __name__ == "__main__":
    print("=== УНИВЕРСАЛЬНЫЕ ЭСТЕТИЧНЫЕ БРЕНДЫ ДЛЯ PINTEREST ===")
    print("-" * 55)
    for _ in range(30):
        name = generate_brand_name()
        # Генерация юзернейма для авторегера
        username = name.replace(" ", "").replace("&", "and").replace(".", "").replace("+", "and").replace("-", "").lower()
        print(f"{name:<35}")