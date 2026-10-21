import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🧠 Welcome to the future of healthy living!",
    "✨ Optimize your body, mind, and lifestyle!",
    "💡 Smart health starts with smart habits!",
    "🌿 Discover a better, healthier version of yourself!",
    "🚀 Upgrade your life with powerful health strategies!",
    "❤️ Balance your body and mind the right way!",
    "📊 Track, improve, and optimize your health daily!",
    "🔥 Biohacking your way to peak performance!",
    "🌟 Small habits, massive life transformation!",
    "💬 Everything about mindful and healthy living!",
    "🧬 Unlock your body’s full potential!",
    "📚 Learn how to live smarter, longer, and better!",
    "⚡ Energy, focus, and health — all in one place!",
    "💎 Your guide to next-level wellness!",
    "🎯 Build a lifestyle that actually works!",
    "🌱 Conscious living starts here!",
    "❤️ Feel better, think clearer, live longer!",
    "📌 Healthy living made simple and effective!",
    "💫 Optimize every aspect of your life!",
    "🎉 Your journey to better health starts now!"
]

# ==== HEALTH TOPICS ====
topics = [
    "biohacking techniques", "healthy daily routines", "sleep optimization",
    "mental clarity", "focus improvement", "energy boosting habits",
    "nutrition optimization", "gut health", "hormone balance",
    "stress management", "mindfulness practices", "habit building",
    "fitness routines", "recovery methods", "cold exposure",
    "intermittent fasting", "hydration habits", "longevity strategies",
    "digital detox", "health tracking", "wearable tech insights",
    "morning routines", "evening routines", "lifestyle optimization"
]

# ==== CONTENT TYPES ====
content_types = [
    "science-backed tips", "step-by-step systems", "optimization strategies",
    "daily routines", "life hacks", "practical methods",
    "beginner-friendly guides", "advanced biohacks",
    "simple frameworks", "proven techniques",
    "high-performance habits", "real-life solutions",
    "health insights", "tracking methods",
    "powerful routines"
]

# ==== APPROACHES / STYLES ====
approaches = [
    "data-driven", "science-backed", "minimalist",
    "high performance", "sustainable", "holistic",
    "mindful", "low effort", "high efficiency",
    "beginner-friendly", "advanced", "time-saving",
    "natural methods", "tech-driven", "balanced lifestyle",
    "consistent habits", "long-term results", "daily optimization"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Start optimizing your life today! 🚀",
    "Better habits, better life! 🌿",
    "Take control of your health now! 💪",
    "Small changes, powerful results! ✨",
    "Upgrade your lifestyle step by step! 🧠",
    "Your health is your greatest asset! ❤️",
    "Stay consistent and evolve daily! 📊",
    "Build a smarter, healthier future! 💎",
    "Level up your daily routine! 🎯",
    "Live better, longer, stronger! 💫"
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
        f"{intro} Learn {topic1} and {topic2} with {content}, optimized for {approach1} and {approach2}. {closing}",
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