import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "📔 Capture the magic of the season with Christmas journaling ideas.",
    "🎄 Discover cozy winter spreads for your bullet journal.",
    "✨ Festive journaling prompts and decorations for memory keeping.",
    "🎅 Create a beautiful December Daily with these journaling supplies.",
    "❄️ Explore winter journaling kits for reflecting on the holidays.",
    "🌟 Aesthetic Christmas scrapbooking and journaling inspiration.",
    "📔 Document your winter memories with festive journal layouts.",
    "🎄 Beautiful digital and printable journaling elements for Christmas.",
    "✨ Add holiday magic to your diary with festive stickers and art.",
    "🎅 Discover whimsical journaling supplies for a cozy winter.",
    "❄️ Perfect tools for crafting your holiday memory books.",
    "🌟 Elevate your bullet journal with winter-themed spreads.",
    "📔 Reflect on the festive season with thoughtful journal pages.",
    "🎄 Christmas junk journal kits filled with vintage charm.",
    "✨ Capture every joyful moment in your winter memory journal.",
    "🎅 Discover creative ways to document your Christmas season.",
    "❄️ Cozy up and journal with these beautiful winter assets.",
    "🌟 Make your December memories last forever with aesthetic journals.",
    "📔 Festive elements to decorate your holiday journaling pages.",
    "🎄 Find inspiration for your next winter bullet journal spread."
]

# ==== PROJECT TYPES ====
project_types = [
    "bullet journaling", "December Daily", "memory keeping", "junk journaling",
    "scrapbooking", "winter diaries", "digital journaling", "GoodNotes journals",
    "holiday reflection", "festive journal spreads", "winter memory books",
    "Christmas scrapbooks", "travelers notebooks", "art journaling",
    "holiday mood boards", "gratitude journaling", "festive habit tracking",
    "seasonal storytelling", "vintage junk journals", "winter photo journals",
    "smash books", "daily holiday reflections"
]

# ==== CONTENT TYPES ====
content_types = [
    "Christmas journaling kits", "winter bullet journal printables", "festive digital stickers",
    "December Daily templates", "junk journal ephemera", "holiday journaling prompts",
    "aesthetic diary layouts", "winter scrapbook supplies", "cozy journaling bundles",
    "Christmas memory keeping kits", "vintage holiday ephemera", "digital journal pages",
    "festive washi tape designs", "winter journaling inspiration", "holiday spread ideas",
    "scrapbook paper packs", "Christmas diary templates", "seasonal journaling art",
    "beautiful winter journal assets", "festive memory books"
]

# ==== STYLES ====
styles = [
    "cozy", "aesthetic", "vintage", "festive", "creative", "whimsical",
    "nostalgic", "beautiful", "printable", "digital", "artsy", "rustic",
    "charming", "memorable", "detailed", "minimalist", "scrapbook-style",
    "handmade", "expressive", "warm"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Start documenting your magical Christmas today! 📔",
    "Save these cozy winter journaling ideas for later. 🎄",
    "Add festive charm to your bullet journal. ✨",
    "Get your holiday junk journal kits now. 🎅",
    "Create beautiful winter memories that last. ❄️",
    "Discover aesthetic supplies for your December Daily. 🌟",
    "Elevate your journaling with these festive elements. 📔",
    "Grab the perfect Christmas memory keeping bundle today. 🎄",
    "Capture the joy of the holidays in your diary. ✨",
    "Your winter journal is ready for festive magic! 🎅",
    "Find peace this season with cozy journaling sessions. ❄️",
    "Explore vintage ephemera for your holiday scrapbooks. 🌟",
    "Make this December unforgettable with beautiful spreads. 📔",
    "Create a nostalgic and creative Christmas journal. 🎄",
    "Beautiful printables for your festive memory book. ✨"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    project1, project2 = random.sample(project_types, 2)
    content = random.choice(content_types)
    style1, style2 = random.sample(styles, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Discover {style1} and {style2} kits crafted for {project1} and {project2}. Explore {content}. {closing}",
        f"{intro} Perfect elements for {project1} and {project2}, featuring {style1} and {style2} designs. Enjoy {content}. {closing}",
        f"{intro} Handpicked {style1} and {style2} supplies designed for {project1} and {project2}. Find {content}. {closing}",
        f"{intro} Explore festive journaling blending {style1} and {style2} styles for {project1} and {project2}. {content}. {closing}",
        f"{intro} Beautiful Christmas elements for {project1}, {project2}, and memory keeping. Discover {content}. {closing}",
        f"{intro} Curated {style1} templates with {style2} details, perfect for {project1} and {project2}. {closing}",
        f"{intro} Elevate {project1} and {project2} using {style1} and {style2} assets. Browse {content}. {closing}",
        f"{intro} Cozy files inspired by {style1} vibes and {style2} creativity for {project1} and {project2}. {closing}"
    ]

    return random.choice(templates)

if __name__ == "__main__":
    print(generate_description())
