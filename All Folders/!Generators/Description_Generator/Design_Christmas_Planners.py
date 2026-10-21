import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "📅 Stay organized this holiday season with beautiful Christmas planners.",
    "🎄 Discover festive digital planners for GoodNotes and iPad.",
    "✨ Plan a stress-free holiday with these perfect winter printables.",
    "🎅 Keep track of gifts, meals, and memories with Christmas planners.",
    "❄️ Explore cozy holiday planner pages to organize your winter.",
    "🌟 Your ultimate tool for a beautifully planned Christmas.",
    "📅 Aesthetic holiday planners for digital and printable use.",
    "🎄 Master the holiday chaos with elegant Christmas organizers.",
    "✨ Festive digital journaling and planning for a magical season.",
    "🎅 Discover complete holiday planners for tracking every detail.",
    "❄️ Winter planning made beautiful with these digital templates.",
    "🌟 Get ready for the holidays with structured and festive planners.",
    "📅 Beautiful planner inserts for a well-organized Christmas.",
    "🎄 Keep your holiday to-dos in check with aesthetic printables.",
    "✨ Transform your iPad into a festive planning wonderland.",
    "🎅 Everything you need to plan the perfect winter celebration.",
    "❄️ Cozy digital planners for organizing gifts, events, and joy.",
    "🌟 Plan your merry moments with these stunning Christmas templates.",
    "📅 Make this holiday stress-free with printable winter planners.",
    "🎄 Discover the best layouts for your seasonal organization."
]

# ==== PROJECT TYPES ====
project_types = [
    "digital planning", "GoodNotes journals", "iPad planning", "printable organizers",
    "holiday gift tracking", "Christmas meal planning", "winter budgeting",
    "festive to-do lists", "seasonal memory keeping", "holiday event planning",
    "Christmas party organizing", "winter bucket lists", "holiday shopping lists",
    "festive habit tracking", "seasonal self-care", "Christmas card tracking",
    "holiday recipe binders", "winter itinerary planning", "festive goal setting",
    "Notability planning", "printable planner inserts", "holiday sticker planning"
]

# ==== CONTENT TYPES ====
content_types = [
    "Christmas digital planners", "holiday printable templates", "festive planner inserts",
    "winter organization kits", "cozy digital journals", "holiday tracking templates",
    "Christmas planner bundles", "aesthetic winter planners", "seasonal planner pages",
    "festive GoodNotes templates", "holiday planning printables", "digital planner stickers",
    "winter planner setups", "Christmas organization tools", "festive iPad planners",
    "holiday planner inspiration", "printable winter agendas", "seasonal life planners",
    "Christmas planning resources", "aesthetic holiday journals"
]

# ==== STYLES ====
styles = [
    "aesthetic", "organized", "festive", "minimalist", "cozy", "functional",
    "beautiful", "structured", "printable", "digital", "hyperlinked", "elegant",
    "cute", "comprehensive", "undated", "dated", "vibrant", "calming",
    "detailed", "practical"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Start planning your perfect Christmas today! 📅",
    "Save these aesthetic planner templates for later. 🎄",
    "Get organized with festive digital planners. ✨",
    "Download your holiday planning printables now. 🎅",
    "Make this winter stress-free and beautifully planned. ❄️",
    "Discover functional planners for a merry season. 🌟",
    "Elevate your GoodNotes with holiday magic. 📅",
    "Grab the perfect Christmas planner bundle today. 🎄",
    "Organize your holiday gifts and meals with ease. ✨",
    "Your iPad is ready for festive planning! 🎅",
    "Find peace this season with structured winter planners. ❄️",
    "Explore cozy templates for your daily holiday to-dos. 🌟",
    "Stay on top of the holidays with these planners. 📅",
    "Create a magical and organized Christmas. 🎄",
    "Beautiful printables for your festive binder. ✨"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    project1, project2 = random.sample(project_types, 2)
    content = random.choice(content_types)
    style1, style2 = random.sample(styles, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Discover {style1} and {style2} templates crafted for {project1} and {project2}. Explore {content}. {closing}",
        f"{intro} Perfect organization for {project1} and {project2}, featuring {style1} and {style2} designs. Enjoy {content}. {closing}",
        f"{intro} Handpicked {style1} and {style2} planners designed for {project1} and {project2}. Find {content}. {closing}",
        f"{intro} Explore festive planning blending {style1} and {style2} styles for {project1} and {project2}. {content}. {closing}",
        f"{intro} Beautiful Christmas planners for {project1}, {project2}, and staying organized. Discover {content}. {closing}",
        f"{intro} Curated {style1} templates with {style2} layouts, perfect for {project1} and {project2}. {closing}",
        f"{intro} Elevate {project1} and {project2} using {style1} and {style2} planners. Browse {content}. {closing}",
        f"{intro} Organized files inspired by {style1} vibes and {style2} functionality for {project1} and {project2}. {closing}"
    ]

    return random.choice(templates)

if __name__ == "__main__":
    print(generate_description())
