import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🥑 Welcome to the keto lifestyle!",
    "🔥 Burn fat the smart way with keto!",
    "✨ Discover the power of low carb, high fat living!",
    "💪 Keto made simple, effective, and delicious!",
    "🌟 Transform your body with keto nutrition!",
    "❤️ Eat fat, burn fat, feel amazing!",
    "🚀 Take your fat loss to the next level with keto!",
    "💡 Smart dieting starts with keto!",
    "📚 Everything you need for keto success!",
    "🥓 Where flavor meets fat burning!",
    "💬 Keto tips that actually work!",
    "🔥 Unlock your body’s fat-burning mode!",
    "✨ Stay energized and focused with keto!",
    "💎 Your go-to source for keto inspiration!",
    "🎯 Achieve your goals with keto strategies!",
    "🥑 Healthy, satisfying, and keto-friendly!",
    "❤️ Love your food and your results!",
    "📌 Keto made easy for everyone!",
    "💫 Fuel your body the right way!",
    "🎉 Your keto journey starts here!"
]

# ==== KETO TOPICS ====
topics = [
    "keto recipes", "keto meal prep", "keto diet plan",
    "keto breakfast ideas", "keto dinners", "keto snacks",
    "fat burning meals", "ketosis tips", "low carb high fat meals",
    "keto desserts", "sugar-free recipes", "keto cooking",
    "keto grocery shopping", "keto lifestyle",
    "keto for beginners", "keto transformation",
    "intermittent fasting keto", "keto weight loss",
    "easy keto meals", "quick keto recipes",
    "high fat meals", "keto macros",
    "keto food swaps", "keto meal ideas"
]

# ==== CONTENT TYPES ====
content_types = [
    "easy recipes", "step-by-step guides", "fat loss strategies",
    "simple meal ideas", "life hacks", "practical tips",
    "beginner-friendly plans", "advanced keto techniques",
    "quick solutions", "daily meal inspiration",
    "must-try recipes", "proven methods",
    "nutrition tips", "meal prep systems",
    "delicious ideas"
]

# ==== KETO APPROACHES ====
approaches = [
    "fast fat burning", "beginner-friendly", "strict keto",
    "lazy keto", "clean keto", "high fat",
    "low carb", "no sugar", "gluten-free",
    "dairy-free", "quick and easy", "meal prep friendly",
    "budget-friendly", "simple ingredients",
    "high protein keto", "balanced keto",
    "time-saving", "sustainable results"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Start your keto journey today! 🥑",
    "Burn fat and feel amazing! 🔥",
    "Stay in ketosis and see results! 💪",
    "Make keto your lifestyle! ✨",
    "Eat better, feel better! ❤️",
    "Transform your body with keto! 🚀",
    "Stay consistent and win! 🎯",
    "Fuel your body the keto way! 💫",
    "Results start with the right diet! 🌟",
    "Level up your nutrition today! 💎"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    topic1, topic2 = random.sample(topics, 2)
    content = random.choice(content_types)
    approach1, approach2 = random.sample(approaches, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Discover {content} for {topic1} and {topic2}, designed for {approach1} and {approach2}. {closing}",
        f"{intro} Learn {topic1} and {topic2} with {content}, perfect for {approach1} and {approach2}. {closing}",
        f"{intro} Your guide to {topic1} and {topic2}. Packed with {content} for {approach1} and {approach2}. {closing}",
        f"{intro} From {topic1} to {topic2}, explore {content} built for {approach1} and {approach2}. {closing}",
        f"{intro} Master {topic1} and {topic2} using {content}, ideal for {approach1} and {approach2}. {closing}",
        f"{intro} Explore {content} around {topic1} and {topic2}, optimized for {approach1} & {approach2}. {closing}",
        f"{intro} Everything about {topic1} and {topic2} with {content} for {approach1} and {approach2}. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST ====
if __name__ == "__main__":
    print(generate_description())