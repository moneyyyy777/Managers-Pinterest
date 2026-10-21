import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🔥 Welcome to your weight loss transformation journey!",
    "✨ Everything you need to lose weight and feel amazing!",
    "💪 Your daily dose of fat loss motivation and tips!",
    "🌟 Discover smarter ways to lose weight and stay fit!",
    "❤️ Build a healthier body and a stronger mindset!",
    "🎯 Real strategies for real weight loss results!",
    "💡 Your guide to sustainable and effective fat loss!",
    "🥗 Fitness, food, and motivation — all in one place!",
    "🚀 Take control of your body and your health today!",
    "💬 Simple steps to achieve your dream body!",
    "🔥 Burn fat, build confidence, and stay consistent!",
    "📚 Learn how to lose weight the right way!",
    "✨ Where discipline meets transformation!",
    "💎 Smart weight loss strategies that actually work!",
    "🎉 Your path to a healthier, leaner you starts here!",
    "🏆 Small changes, big weight loss results!",
    "⚡ Fast, effective, and realistic fat loss tips!",
    "❤️ Feel better, look better, live better!",
    "📌 Everything about weight loss made simple!",
    "💫 Transform your body and your lifestyle!"
]

# ==== WEIGHT LOSS TOPICS ====
topics = [
    "fat burning workouts", "healthy meal planning", "calorie deficit",
    "home workouts", "gym training", "cardio routines",
    "strength training", "HIIT workouts", "weight loss diet",
    "clean eating", "meal prep", "portion control",
    "metabolism boosting", "belly fat loss", "full body transformation",
    "quick fat loss", "sustainable weight loss", "daily fitness habits",
    "mindset and motivation", "discipline building",
    "healthy lifestyle", "low calorie recipes",
    "intermittent fasting", "keto diet", "high protein meals"
]

# ==== CONTENT TYPES ====
content_types = [
    "proven tips", "step-by-step guides", "fat loss strategies",
    "easy routines", "life hacks", "practical advice",
    "beginner-friendly plans", "advanced techniques",
    "quick methods", "real-life solutions",
    "daily habits", "simple systems",
    "effective workouts", "nutrition guides",
    "motivational insights"
]

# ==== STYLES / APPROACHES ====
approaches = [
    "fast results", "sustainable results", "beginner-friendly",
    "intense", "low effort", "high efficiency",
    "home-based", "gym-based", "science-backed",
    "simple", "time-saving", "realistic",
    "no equipment", "high energy", "low impact",
    "balanced lifestyle", "strict discipline", "flexible dieting"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Start your transformation today! 🔥",
    "Stay consistent and see real results! 💪",
    "Your dream body is closer than you think! ✨",
    "Take the first step now! 🚀",
    "Small changes lead to big results! 🏆",
    "Stay motivated and keep pushing! ❤️",
    "Make fitness part of your lifestyle! 💫",
    "Results come to those who don’t quit! ⚡",
    "Level up your fitness journey today! 🎯",
    "Become the best version of yourself! 💎"
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