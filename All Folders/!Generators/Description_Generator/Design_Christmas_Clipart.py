import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🎨 Discover cute and cozy Christmas clipart for your holiday crafts.",
    "🎄 Beautiful watercolor winter graphics to bring your designs to life.",
    "✨ Festive illustrations perfect for adding magic to your projects.",
    "🎅 Hand-drawn Christmas clipart for joyful and merry creations.",
    "❄️ Explore whimsical winter elements for your seasonal designs.",
    "🌟 Vibrant holiday clipart bundles for endless creative fun.",
    "🎨 Magical Christmas illustrations crafted with love and detail.",
    "🎄 Sweet and charming graphics for your winter crafting needs.",
    "✨ Elevate your holiday designs with stunning watercolor clipart.",
    "🎅 Discover playful and festive illustrations for every project.",
    "❄️ Add a touch of winter wonder with these adorable clipart sets.",
    "🌟 High-quality Christmas graphics for scrapbooking and more.",
    "🎨 Hand-painted holiday elements to make your designs pop.",
    "🎄 Cute winter characters and festive scenes for your crafts.",
    "✨ Beautifully detailed Christmas clipart for seasonal joy.",
    "🎅 Unleash your creativity with these magical winter graphics.",
    "❄️ Perfect holiday illustrations for cards, tags, and prints.",
    "🌟 Discover joyful clipart collections for a merry season.",
    "🎨 Whimsical winter art to inspire your next creative project.",
    "🎄 Festive graphic elements to complete your holiday designs."
]

# ==== PROJECT TYPES ====
project_types = [
    "scrapbooking", "Christmas cards", "gift tags", "holiday invitations",
    "winter junk journals", "festive stickers", "nursery decor", "children's apparel",
    "holiday printables", "party decorations", "seasonal mugs", "Christmas ornaments",
    "festive stationery", "winter packaging", "social media posts", "holiday newsletters",
    "seasonal branding", "digital planners", "festive art prints", "winter craft projects",
    "holiday wrapping paper", "Christmas banners", "festive educational materials"
]

# ==== CONTENT TYPES ====
content_types = [
    "Christmas clipart bundles", "watercolor winter graphics", "festive illustration packs",
    "cute holiday elements", "hand-drawn Christmas art", "whimsical clipart collections",
    "seasonal graphic assets", "magical winter illustrations", "joyful clipart sets",
    "holiday design elements", "festive watercolor clipart", "winter character graphics",
    "Christmas scrapbooking art", "holiday sticker designs", "seasonal graphic inspiration",
    "adorable winter clipart", "festive floral graphics", "Christmas element packs",
    "winter scene illustrations", "holiday crafting graphics"
]

# ==== STYLES ====
styles = [
    "watercolor", "hand-drawn", "cute", "whimsical", "cozy", "festive",
    "magical", "vibrant", "playful", "charming", "sweet", "detailed",
    "rustic", "vintage", "modern", "cheerful", "adorable", "joyful",
    "aesthetic", "beautiful"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Start crafting with these cute Christmas graphics today! 🎨",
    "Save your favorite winter clipart collections. 🎄",
    "Add magical illustrations to your holiday projects. ✨",
    "Discover joyful graphics for endless creativity. 🎅",
    "Get your festive watercolor clipart now. ❄️",
    "Perfect for all your cozy winter crafts. 🌟",
    "Explore charming Christmas illustrations today. 🎨",
    "Bring your holiday designs to life with these graphics. 🎄",
    "Create sweet and festive crafts with ease. ✨",
    "Download adorable winter clipart for your next project. 🎅",
    "Elevate your scrapbooking with magical holiday art. ❄️",
    "Find the perfect festive elements for your designs. 🌟",
    "Start your merry crafting journey here. 🎨",
    "Discover beautiful Christmas graphics you'll love. 🎄",
    "Add a splash of winter watercolor to your art. ✨"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    project1, project2 = random.sample(project_types, 2)
    content = random.choice(content_types)
    style1, style2 = random.sample(styles, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Discover {style1} and {style2} clipart crafted for {project1} and {project2}. Explore {content}. {closing}",
        f"{intro} Magical illustrations for {project1} and {project2}, featuring {style1} and {style2} designs. Enjoy {content}. {closing}",
        f"{intro} Handpicked {style1} and {style2} graphics designed for {project1} and {project2}. Find {content}. {closing}",
        f"{intro} Explore festive art blending {style1} and {style2} charm for {project1} and {project2}. {content}. {closing}",
        f"{intro} Beautiful Christmas clipart for {project1}, {project2}, and seasonal crafts. Discover {content}. {closing}",
        f"{intro} Curated {style1} graphics with {style2} details, perfect for {project1} and {project2}. {closing}",
        f"{intro} Elevate {project1} and {project2} using {style1} and {style2} elements. Browse {content}. {closing}",
        f"{intro} Joyful clipart inspired by {style1} vibes and {style2} cheer for {project1} and {project2}. {closing}"
    ]

    return random.choice(templates)

if __name__ == "__main__":
    print(generate_description())
