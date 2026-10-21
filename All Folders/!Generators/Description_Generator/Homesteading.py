import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🌿 Welcome to the world of self-sufficient living!",
    "🏡 Discover the beauty of the homestead lifestyle!",
    "🌾 Your daily source of homesteading inspiration and practical skills!",
    "✨ Learn how to build a more sustainable and independent life!",
    "🌱 Explore simple living, natural solutions, and self-reliance!",
    "🐓 Join a community passionate about homesteading and preparedness!",
    "🍯 From garden to pantry — everything you need for homestead success!",
    "🪴 Practical knowledge for modern homesteaders and country dreamers!",
    "🌻 Helping you create a thriving and resilient homestead!",
    "🚜 Discover traditional skills that still matter today!"
]

# ==== HOMESTEADING TOPICS ====
topics = [
    "backyard chickens",
    "food preservation",
    "canning and pantry storage",
    "herbal remedies",
    "organic gardening",
    "sustainable living",
    "self-sufficiency",
    "homestead planning",
    "off-grid projects",
    "simple living",
    "composting",
    "raising livestock",
    "preparedness",
    "homemade products",
    "natural wellness",
    "farmhouse living",
    "seasonal harvesting",
    "DIY homestead projects",
    "rainwater collection",
    "permaculture"
]

# ==== CONTENT TYPES ====
content_types = [
    "practical guides",
    "step-by-step tutorials",
    "homestead tips",
    "expert advice",
    "inspiring ideas",
    "real-life experiences",
    "beginner-friendly lessons",
    "traditional skills",
    "self-reliance strategies",
    "sustainable living resources",
    "homestead blueprints",
    "helpful checklists",
    "seasonal recommendations",
    "DIY solutions",
    "preparedness insights"
]

# ==== FOCUS AREAS ====
focus_areas = [
    "self-sufficiency",
    "food security",
    "natural living",
    "rural lifestyle",
    "sustainable practices",
    "homestead skills",
    "independent living",
    "farm-to-table living",
    "resourcefulness",
    "backyard farming"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Follow us for daily homesteading inspiration! 🌻",
    "Start building the life you've always dreamed of! 🏡",
    "Join thousands learning practical homestead skills! 🌿",
    "Your journey toward self-sufficiency starts here! ✨",
    "Grow, preserve, and thrive with us! 🌾",
    "Learn something new for your homestead every day! 🐓",
    "Simple living begins with small steps — follow along! 🍯",
    "Create a more resilient and sustainable future! 🌱",
    "Discover the freedom of homestead living! 🚜",
    "Let's build a thriving homestead together! 🌻"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)

    topic1, topic2 = random.sample(topics, 2)
    content = random.choice(content_types)

    focus1, focus2 = random.sample(focus_areas, 2)

    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Explore {topic1} and {topic2} through {content}. Helping you master {focus1} and {focus2}. {closing}",

        f"{intro} Discover practical knowledge about {topic1} and {topic2}. Packed with {content} for anyone interested in {focus1}. {closing}",

        f"{intro} Your source for {content}, covering everything from {topic1} to {topic2}. Build confidence in {focus1} and {focus2}. {closing}",

        f"{intro} Learn valuable homestead skills through {topic1}, {topic2}, and other {content}. Perfect for those pursuing {focus1}. {closing}",

        f"{intro} We share {content} focused on {topic1} and {topic2}, helping you create a lifestyle centered around {focus1} and {focus2}. {closing}",

        f"{intro} Find inspiration, {content}, and proven ideas for {topic1} and {topic2}. Take the next step toward {focus1}. {closing}",

        f"{intro} From {topic1} to {topic2}, our {content} help make {focus1} and {focus2} achievable for everyone. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST ====
if __name__ == "__main__":
    print(generate_description())