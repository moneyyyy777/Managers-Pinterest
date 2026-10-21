import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (Зимние, рождественские и эстетичные) ======
adjectives = [
    # Christmas & Winter
    "Festive", "Snowy", "Winter", "Frosty", "Holly", "Jolly", "Merry", "Icy",
    "Chilly", "Cozy", "Magic", "Starry", "Sparkly", "Glacial", "Arctic",
    "Twinkling", "Glistening", "Cheerful", "Bright", "Pine", "Balsam", "Frozen",
    "Gingerbread", "Peppermint", "Candy", "Sugar", "Woolen", "Knitted", "Yuletide",
    "Evergreen", "Scarlet", "Crimson", "Polar", "North", "Gleaming", "Luminescent",
    "Miraculous", "Blessed", "Blissful", "Silent", "Holy", "Dazzling", "Biting",
    "Brisk", "Crisp", "Frosted", "Gilded", "Golden", "Silver", "Velvet",
    # Трендовая эстетика (Универсальные)
    "Elegant", "Timeless", "Minimal", "Whimsical", "Chic", "Playful", "Radiant",
    "Organic", "Ethereal", "Rustic", "Pastel", "Boho", "Nordic", "Moody", "Airy",
    "Aesthetic", "Vintage", "Retro", "Dreamy", "Curated", "Bespoke", "Artisan",
    "Joyful", "Wild", "Noble", "Cosmic", "Inspired", "Secret", "Quiet"
]

adjectives.extend([
    "Ambient","Blooming","Bold","Calm","Captured","Celestial","Classic","Clean","Cloudy",
    "Delicate","Detailed","Earthy","Effortless","Emerald","Endless","Essential",
    "Fine","Floating","Fresh","Gentle","Glass","Graceful","Handmade","Illuminated",
    "Ivory","Layered","Lightweight","Local","Natural","Neutral","Peaceful","Perfect",
    "Powder","Rare","Rich","Rose","Serene","Soft","Subtle","Sunny","Textured",
    "Warm","White","Woodland","Artistic","Refined","Sophisticated","Premium",
    "Luxury","Signature","Studio","Boutique","Creative","Expressive",
    "Classic","Heritage","Authentic","Poetic","Radiant","Lively"
])

# ====== СУЩЕСТВИТЕЛЬНЫЕ (Зима, Рождество, Праздники и Дизайн) ======
nouns = [
    # Christmas & Winter
    "Christmas", "Yule", "Santa", "Snow", "Snowflake", "Frost", "Ice", "Elf",
    "Reindeer", "Sleigh", "Bell", "Jingle", "Mistletoe", "Tree", "Fir", "Cedar",
    "Ornament", "Bauble", "Wreath", "Garland", "Tinsel", "Star", "Angel",
    "Gift", "Present", "Ribbon", "Bow", "Stocking", "Fireplace", "Hearth",
    "Chimney", "Cocoa", "CandyCane", "Cookie", "Sugarplum", "Nutcracker",
    "Carol", "Chime", "Miracle", "Joy", "Wonderland", "Glacier", "Iceberg",
    "Blizzard", "Flurry", "Snowdrift", "Icicle", "Sweater", "Scarf", "Mittens",
    "Cabin", "Chalet", "Lodge", "Sled", "Toboggan",
    # Арт и дизайн-концепции (Универсально)
    "Design", "Art", "Ideas", "Studio", "Creations", "Lab", "Concepts", "House", 
    "Works", "Hub", "Dreams", "Solutions", "Gallery", "Visions", "Collective",
    "Craft", "Edge", "Matrix", "Canvas", "Texture", "Pattern", "Frame", "Scene",
    "Pixel", "Ink", "Shape", "Layer", "Palette", "Hue", "Shade", "Sketch", "Vector",
    # Природа и атмосфера
    "Aura", "Prism", "Trace", "Tale", "Pulse", "Rhythm", "Echo", "Wave", "Dawn",
    "Dusk", "Horizon", "Shadow", "Light", "Glow", "Spark", "Space", "Vibe", "Mood",
    "Atmosphere", "Haven", "Moon", "Stars", "Cloud",
    # Тренды архивации
    "Archive", "Diary", "Journal", "Magazine", "Edit", "Index", "Chronicle", 
    "Log", "Catalogue", "Directory", "Folio", "Portfolio", "Vision", "Moodboard", 
    "Board", "Files", "Notes", "Pages", "Book"
]

nouns.extend([
    "Avenue","Balance","Beacon","Blend","Block","Branch","Bridge","Collection",
    "Corner","Current","Curve","Direction","Element","Field","Foundation","Garden",
    "Hill","Island","Journey","Key","Kingdom","Library","Loft","Loop","Memory",
    "Method","Moment","Mountain","Origin","Path","Peak","Place","Point","Portal",
    "Project","Realm","Reserve","River","Route","Sequence","Source","Square",
    "Story","Summit","Surface","System","Theme","Thread","Tower","Trail","Universe",
    "Valley","View","Village","World","Zone","Album","Bundle","Card","Catalog",
    "Chapter","Circle","Edition","Episode","Essence","File","Folder","Gallery",
    "Guide","Inspiration","Kit","Notebook","Package","Piece","Pin","Plan","Poster",
    "Preset","Profile","Resource","Series","Set","Shelf","Snapshot","Style",
    "Template","Toolkit","Treasure","Vault","Visual","Workshop","Workspace",
    "Nest","Forest","Meadow","Stone","Crystal","Leaf","Pinecone","Mist",
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
    "Visual", "Bureau of", "Dept.", "Modern", "Base", "Concept", "Curated",
    "Festive", "Winter", "Merry", "Jolly"
]

modifiers_prefix.extend([
    "North","South","East","West","Urban","Daily","Sunday","Monday",
    "Original","True","Pure","Open","Hidden","Little","Grand",
    "Local","Found","New","Old","Future","Next","First","Second",
    "Collective","Studio of","House","Office of","Archive of",
    "Society of","Circle of","Guild of","Curated","Selected",
    "Essential","Signature","Private","Public","Parallel",
    "Beyond","Inside","Outer","Inner","Project","Minimal"
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
    Генерирует названия брендов для ниши Christmas / Winter.
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
    print("=== CHRISTMAS & WINTER БРЕНДЫ ДЛЯ PINTEREST ===")
    print("-" * 55)
    for _ in range(30):
        name = generate_brand_name()
        # Генерация юзернейма для авторегера
        username = name.replace(" ", "").replace("&", "and").replace(".", "").replace("+", "and").replace("-", "").lower()
        print(f"{name:<35}")
