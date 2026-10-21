import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "✂️ Discover perfect Christmas SVG cut files for your Cricut projects.",
    "🎄 Festive vector graphics ready for Silhouette and vinyl cutting.",
    "✨ Create stunning holiday crafts with these flawless SVG designs.",
    "🎅 High-quality Christmas SVGs for laser cutting and plotters.",
    "❄️ Explore intricate winter cut files for your DIY holiday gifts.",
    "🌟 Ready-to-cut festive SVGs for apparel, mugs, and decor.",
    "✂️ Clean and easy-to-use Christmas vectors for crafters.",
    "🎄 Unlock your crafting potential with these magical holiday SVGs.",
    "✨ Perfect SVG bundles for all your festive vinyl projects.",
    "🎅 Detailed winter cut files designed specifically for makers.",
    "❄️ Transform your holiday crafting with premium Christmas SVGs.",
    "🌟 Discover layered SVG designs for dimensional winter crafts.",
    "✂️ Flawless cut files for your next festive DIY masterpiece.",
    "🎄 Bring your holiday ideas to life with these versatile SVGs.",
    "✨ The best Christmas vectors for Cricut, Silhouette, and more.",
    "🎅 Fun and festive SVG quotes for holiday shirts and signs.",
    "❄️ Clean vector paths for smooth and easy winter crafting.",
    "🌟 Your go-to source for high-quality Christmas cut files.",
    "✂️ Craft beautiful holiday ornaments and gifts with these SVGs.",
    "🎄 Explore trending winter SVG designs for your creative business."
]

# ==== PROJECT TYPES ====
project_types = [
    "Cricut projects", "Silhouette crafts", "vinyl decals", "holiday t-shirts",
    "custom mugs", "laser cut ornaments", "wood signs", "tote bags",
    "festive apparel", "DIY holiday gifts", "paper crafting", "glassware etching",
    "winter home decor", "Christmas doormats", "custom pillows", "iron-on transfers",
    "festive cake toppers", "holiday card making", "acrylic ornaments", "seasonal tumblers",
    "stencil projects", "sublimation blanks", "holiday gift tags", "CNC routing"
]

# ==== CONTENT TYPES ====
content_types = [
    "Christmas SVG bundles", "holiday cut files", "festive vector graphics",
    "winter Cricut designs", "layered SVG designs", "laser cutting files",
    "festive quote SVGs", "Christmas silhouette files", "vinyl craft designs",
    "clean vector assets", "holiday crafting SVGs", "winter sign SVGs",
    "Christmas ornament files", "festive apparel SVGs", "seasonal crafting vectors",
    "high-quality cut files", "DIY project SVGs", "holiday maker files",
    "winter vector bundles", "Christmas cut file inspiration"
]

# ==== STYLES ====
styles = [
    "clean", "layered", "intricate", "easy-to-cut", "festive", "typography-based",
    "fun", "funny", "cute", "elegant", "rustic", "modern", "detailed",
    "minimalist", "bold", "vintage", "playful", "crafty", "versatile", "flawless"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Fire up your Cricut and start crafting today! ✂️",
    "Save these perfect Christmas SVGs for later. 🎄",
    "Download clean cut files for your holiday projects. ✨",
    "Get crafting with these festive Silhouette designs. 🎅",
    "Perfect for all your winter vinyl creations. ❄️",
    "Discover the best SVGs for your DIY holiday gifts. 🌟",
    "Ready to cut and craft your festive ideas? ✂️",
    "Elevate your maker business with premium SVGs. 🎄",
    "Grab your favorite holiday cut files now. ✨",
    "Happy crafting with these magical winter vectors! 🎅",
    "Explore flawless SVGs for stress-free cutting. ❄️",
    "Make this Christmas creative with beautiful SVGs. 🌟",
    "Your Cricut is going to love these festive designs. ✂️",
    "Start your next holiday DIY project here. 🎄",
    "Find the perfect vector for your winter crafts. ✨"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    project1, project2 = random.sample(project_types, 2)
    content = random.choice(content_types)
    style1, style2 = random.sample(styles, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Discover {style1} and {style2} SVGs crafted for {project1} and {project2}. Explore {content}. {closing}",
        f"{intro} Perfect cut files for {project1} and {project2}, featuring {style1} and {style2} designs. Enjoy {content}. {closing}",
        f"{intro} Handpicked {style1} and {style2} vectors designed for {project1} and {project2}. Find {content}. {closing}",
        f"{intro} Explore festive SVGs blending {style1} and {style2} styles for {project1} and {project2}. {content}. {closing}",
        f"{intro} Flawless Christmas SVGs for {project1}, {project2}, and DIY crafts. Discover {content}. {closing}",
        f"{intro} Curated {style1} cut files with {style2} details, perfect for {project1} and {project2}. {closing}",
        f"{intro} Elevate {project1} and {project2} using {style1} and {style2} vectors. Browse {content}. {closing}",
        f"{intro} Ready-to-cut files inspired by {style1} vibes and {style2} cheer for {project1} and {project2}. {closing}"
    ]

    return random.choice(templates)

if __name__ == "__main__":
    print(generate_description())
