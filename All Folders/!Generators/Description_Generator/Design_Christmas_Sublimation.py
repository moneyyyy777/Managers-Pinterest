import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "👕 Discover vibrant Christmas sublimation designs for your heat press.",
    "🎄 Beautiful winter graphics perfect for custom mugs and tumblers.",
    "✨ Create stunning holiday apparel with these high-resolution sublimation files.",
    "🎅 Festive PNG designs ready for your next sublimation project.",
    "❄️ Explore colorful winter prints for t-shirts, tote bags, and more.",
    "🌟 Ready-to-press holiday designs for your sublimation business.",
    "👕 Vibrant and seamless Christmas patterns for tumbler wraps.",
    "🎄 Unlock your heat press potential with these magical holiday graphics.",
    "✨ Perfect sublimation bundles for all your festive custom gifts.",
    "🎅 Detailed winter PNGs designed specifically for vivid printing.",
    "❄️ Transform your holiday crafting with premium Christmas sublimation files.",
    "🌟 Discover bleached shirt designs and distressed winter graphics.",
    "👕 Flawless print files for your next festive apparel masterpiece.",
    "🎄 Bring your holiday merch to life with these versatile sublimation PNGs.",
    "✨ The best Christmas graphics for mugs, coasters, and blanks.",
    "🎅 Fun and festive sublimation quotes for holiday shirts and sweaters.",
    "❄️ High-quality transparent PNGs for smooth and easy winter printing.",
    "🌟 Your go-to source for vibrant Christmas sublimation designs.",
    "👕 Craft beautiful custom holiday gifts with these print-ready files.",
    "🎄 Explore trending winter sublimation art for your creative shop."
]

# ==== PROJECT TYPES ====
project_types = [
    "sublimation t-shirts", "custom holiday mugs", "tumbler wraps", "festive tote bags",
    "Christmas ornaments", "bleached shirt designs", "holiday sweaters", "custom coasters",
    "sublimation blanks", "winter apparel", "festive keychains", "mouse pads",
    "holiday throw pillows", "sublimation garden flags", "custom winter blankets",
    "Christmas doormats", "festive car coasters", "holiday puzzles", "custom aprons",
    "winter pet bandanas", "heat press projects", "sublimation gifts"
]

# ==== CONTENT TYPES ====
content_types = [
    "Christmas sublimation bundles", "holiday PNG files", "festive tumbler wraps",
    "winter print-ready graphics", "vibrant sublimation designs", "bleach effect PNGs",
    "festive quote graphics", "Christmas mug wraps", "sublimation apparel designs",
    "high-res PNG assets", "holiday crafting prints", "winter seamless patterns",
    "Christmas ornament graphics", "festive sublimation art", "seasonal print files",
    "premium sublimation graphics", "DIY heat press designs", "holiday maker PNGs",
    "winter sublimation collections", "Christmas print inspiration"
]

# ==== STYLES ====
styles = [
    "vibrant", "high-resolution", "print-ready", "colorful", "festive", "seamless",
    "distressed", "bleached-style", "cute", "elegant", "rustic", "modern",
    "detailed", "funny", "bold", "vintage", "playful", "professional",
    "eye-catching", "flawless"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Fire up your heat press and start creating today! 👕",
    "Save these perfect Christmas sublimation designs for later. 🎄",
    "Download vibrant PNGs for your holiday printing projects. ✨",
    "Get crafting with these festive tumbler wraps. 🎅",
    "Perfect for all your winter custom apparel creations. ❄️",
    "Discover the best prints for your DIY holiday gifts. 🌟",
    "Ready to press and sell your festive ideas? 👕",
    "Elevate your sublimation business with premium graphics. 🎄",
    "Grab your favorite holiday print files now. ✨",
    "Happy pressing with these magical winter PNGs! 🎅",
    "Explore flawless graphics for stress-free sublimation. ❄️",
    "Make this Christmas colorful with beautiful prints. 🌟",
    "Your heat press is going to love these festive designs. 👕",
    "Start your next custom holiday project here. 🎄",
    "Find the perfect vibrant graphic for your winter crafts. ✨"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    project1, project2 = random.sample(project_types, 2)
    content = random.choice(content_types)
    style1, style2 = random.sample(styles, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Discover {style1} and {style2} designs crafted for {project1} and {project2}. Explore {content}. {closing}",
        f"{intro} Perfect prints for {project1} and {project2}, featuring {style1} and {style2} graphics. Enjoy {content}. {closing}",
        f"{intro} Handpicked {style1} and {style2} PNGs designed for {project1} and {project2}. Find {content}. {closing}",
        f"{intro} Explore festive sublimation blending {style1} and {style2} styles for {project1} and {project2}. {content}. {closing}",
        f"{intro} Flawless Christmas prints for {project1}, {project2}, and custom gifts. Discover {content}. {closing}",
        f"{intro} Curated {style1} graphics with {style2} details, perfect for {project1} and {project2}. {closing}",
        f"{intro} Elevate {project1} and {project2} using {style1} and {style2} PNGs. Browse {content}. {closing}",
        f"{intro} Ready-to-press files inspired by {style1} vibes and {style2} cheer for {project1} and {project2}. {closing}"
    ]

    return random.choice(templates)

if __name__ == "__main__":
    print(generate_description())
