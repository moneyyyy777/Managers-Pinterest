import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🥑 Welcome to the world of low carb living!",
    "✨ Discover delicious low carb meals without the guilt!",
    "🔥 Your daily source of healthy low carb inspiration!",
    "💪 Eat smarter with low carb recipes that actually satisfy!",
    "🌟 Low carb eating made simple, tasty, and effective!",
    "❤️ Enjoy food while staying on track with your goals!",
    "🥗 Healthy, easy, and low in carbs — just how it should be!",
    "🚀 Transform your diet with powerful low carb ideas!",
    "💡 Smart nutrition starts with low carb choices!",
    "📚 Learn how to eat better with low carb meals!",
    "🥑 Where flavor meets healthy low carb lifestyle!",
    "💬 Simple low carb swaps that change everything!",
    "🔥 Burn fat with the right low carb foods!",
    "✨ Feel lighter, healthier, and more energized!",
    "💎 Your go-to source for low carb recipes and ideas!",
    "🎯 Stay on track with easy low carb meals!",
    "🥗 Clean eating starts with cutting carbs smartly!",
    "❤️ Love what you eat while keeping carbs low!",
    "📌 Low carb eating made easy for everyone!",
    "💫 Better food choices start here!"
]

# ==== LOW CARB TOPICS ====
topics = [
    "low carb recipes", "keto meals", "low carb breakfasts",
    "low carb dinners", "healthy snacks", "sugar-free desserts",
    "meal prep ideas", "quick low carb meals",
    "high protein low carb meals", "low carb baking",
    "gluten-free low carb meals", "easy keto recipes",
    "low carb lunches", "fat burning meals",
    "low carb diet plan", "clean eating recipes",
    "low carb food swaps", "no sugar meals",
    "low carb lifestyle", "healthy meal ideas",
    "simple recipes", "weight loss meals",
    "low carb comfort food", "fast cooking recipes"
]

# ==== CONTENT TYPES ====
content_types = [
    "easy recipes", "step-by-step guides", "healthy ideas",
    "quick meals", "life hacks", "practical tips",
    "beginner-friendly recipes", "advanced cooking ideas",
    "simple methods", "daily meal inspiration",
    "must-try dishes", "creative recipes",
    "meal prep systems", "nutrition tips",
    "delicious solutions"
]

# ==== FOOD STYLES / APPROACHES ====
approaches = [
    "quick and easy", "high protein", "fat burning",
    "beginner-friendly", "keto-friendly", "gluten-free",
    "sugar-free", "dairy-free", "clean eating",
    "comfort food style", "meal prep friendly",
    "low effort", "high energy", "balanced",
    "family-friendly", "budget-friendly",
    "simple ingredients", "fast cooking"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Start eating smarter today! 🥑",
    "Enjoy every bite without the carbs! ✨",
    "Healthy eating made simple! 💪",
    "Stay consistent and see results! 🔥",
    "Make low carb your lifestyle! ❤️",
    "Fuel your body the right way! 🚀",
    "Delicious food, better results! 💫",
    "Feel better with every meal! 🌟",
    "Transform your diet today! 🎯",
    "Eat clean, feel amazing! 🥗"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    topic1, topic2 = random.sample(topics, 2)
    content = random.choice(content_types)
    approach1, approach2 = random.sample(approaches, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Discover {content} for {topic1} and {topic2}, perfect for {approach1} and {approach2}. {closing}",
        f"{intro} Learn {topic1} and {topic2} with {content}, designed for {approach1} and {approach2}. {closing}",
        f"{intro} Your guide to {topic1} and {topic2}. Packed with {content} for {approach1} and {approach2}. {closing}",
        f"{intro} From {topic1} to {topic2}, explore {content} built for {approach1} and {approach2}. {closing}",
        f"{intro} Master {topic1} and {topic2} with {content}, ideal for {approach1} and {approach2}. {closing}",
        f"{intro} Explore {content} around {topic1} and {topic2}, optimized for {approach1} & {approach2}. {closing}",
        f"{intro} Everything about {topic1} and {topic2} with {content} for {approach1} and {approach2}. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST ====
if __name__ == "__main__":
    print(generate_description())