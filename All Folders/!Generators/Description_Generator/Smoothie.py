import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🥤 Welcome to the world of delicious and healthy smoothies!",
    "🍓 Discover smoothie recipes that make healthy living easier!",
    "🌿 Your daily source of smoothie inspiration and nutrition tips!",
    "✨ Blend your way to a healthier lifestyle!",
    "🍍 Explore colorful smoothies packed with flavor and goodness!",
    "💚 Healthy habits start with the right ingredients!",
    "🥭 Discover smoothie ideas for every goal and lifestyle!",
    "🍌 Find easy recipes that fit into your wellness journey!",
    "🌱 Fresh smoothie inspiration for every day of the week!",
    "🍇 Helping you enjoy nutritious drinks you'll actually love!"
]

# ==== SMOOTHIE TOPICS ====
topics = [
    "green smoothies",
    "fruit smoothies",
    "protein smoothies",
    "breakfast smoothies",
    "meal replacement smoothies",
    "healthy smoothie recipes",
    "berry smoothies",
    "tropical smoothies",
    "detox smoothies",
    "weight loss smoothies",
    "high-protein drinks",
    "healthy breakfast ideas",
    "nutrient-rich recipes",
    "wellness drinks",
    "energy-boosting smoothies",
    "gut-friendly smoothies",
    "low-calorie smoothies",
    "smoothie meal prep",
    "healthy ingredients",
    "superfood smoothies"
]

# ==== CONTENT TYPES ====
content_types = [
    "smoothie recipes",
    "nutrition tips",
    "healthy drink ideas",
    "wellness inspiration",
    "step-by-step guides",
    "meal prep ideas",
    "healthy habit strategies",
    "ingredient recommendations",
    "recipe collections",
    "practical advice",
    "easy tutorials",
    "healthy lifestyle tips",
    "nutrition guides",
    "recipe inspiration",
    "everyday wellness ideas"
]

# ==== FOCUS AREAS ====
focus_areas = [
    "healthy living",
    "balanced nutrition",
    "wellness",
    "daily energy",
    "healthy habits",
    "weight management",
    "meal planning",
    "nutrition awareness",
    "active lifestyles",
    "overall well-being"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Follow us for daily smoothie inspiration! 🥤",
    "Discover new recipes every day! 🍓",
    "Blend your way to better habits! 🌿",
    "Healthy living starts with simple choices! 💚",
    "Find your next favorite smoothie recipe! 🍍",
    "Make nutrition delicious and easy! 🍌",
    "Stay inspired on your wellness journey! ✨",
    "Explore smoothies for every lifestyle and goal! 🥭",
    "Create healthier routines one smoothie at a time! 🌱",
    "Join a community passionate about healthy living! 🍇"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)

    topic1, topic2 = random.sample(topics, 2)
    content = random.choice(content_types)

    focus1, focus2 = random.sample(focus_areas, 2)

    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Explore {topic1} and {topic2} through {content}. Helping you improve {focus1} and {focus2}. {closing}",

        f"{intro} Discover practical ideas for {topic1} and {topic2}. Packed with {content} for anyone interested in {focus1}. {closing}",

        f"{intro} Your source for {content}, covering everything from {topic1} to {topic2}. Build confidence in {focus1} and {focus2}. {closing}",

        f"{intro} Learn through {topic1}, {topic2}, and other {content}. Perfect for those focused on {focus1}. {closing}",

        f"{intro} We share {content} centered around {topic1} and {topic2}, helping you embrace {focus1} and {focus2}. {closing}",

        f"{intro} Find inspiration, recipes, and practical ideas for {topic1} and {topic2}. Take the next step toward {focus1}. {closing}",

        f"{intro} From {topic1} to {topic2}, our {content} help make {focus1} and {focus2} part of everyday life. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST ====
if __name__ == "__main__":
    print(generate_description())