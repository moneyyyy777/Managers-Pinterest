import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "✨ Welcome to the world of bright smiles and healthy teeth!",
    "🦷 Discover the secrets to a perfect, glowing smile!",
    "🌿 Your daily dose of oral care tips and natural remedies!",
    "💎 Transform your smile with our ultimate teeth care guides!",
    "🌟 Achieve the pearly whites you've always dreamed of!",
    "🤍 Everything you need for a healthy mouth and fresh breath!",
    "✨ Aesthetic smiles and flawless dental hygiene start here!",
    "🪥 Inspiring you to build the perfect oral care routine!",
    "🌿 Natural hacks for stronger teeth and healthier gums!",
    "💎 Unleash your most confident smile today!"
]

# ==== TEETH/SMILE TOPICS ====
topics = [
    "teeth whitening",
    "oral hygiene routines",
    "gum health",
    "fresh breath hacks",
    "natural dental remedies",
    "aesthetic smiles",
    "holistic oral care",
    "enamel protection",
    "cavity prevention",
    "smile makeovers",
    "oil pulling benefits",
    "daily teeth care",
    "healthy mouth habits",
    "braces & aligner care",
    "sensitive teeth relief",
    "DIY whitening tricks",
    "tongue cleaning",
    "fluoride-free care",
    "oral microbiome",
    "pearly whites"
]

# ==== CONTENT TYPES ====
content_types = [
    "expert tips",
    "step-by-step routines",
    "natural remedies",
    "product recommendations",
    "life hacks",
    "aesthetic guides",
    "daily habits",
    "easy-to-follow methods",
    "hygiene checklists",
    "proven strategies",
    "before & after inspiration",
    "wellness advice",
    "practical solutions",
    "DIY recipes",
    "healthy lifestyle tips"
]

# ==== FOCUS AREAS ====
focus_areas = [
    "a radiant smile",
    "better oral wellness",
    "unshakable confidence",
    "long-lasting fresh breath",
    "natural beauty",
    "stronger teeth",
    "overall dental health",
    "a perfect aesthetic smile",
    "gum vitality",
    "holistic well-being",
    "flawless oral hygiene",
    "a brighter appearance"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Follow us for daily smile inspiration! ✨",
    "Start your journey to a brighter smile today! 🦷",
    "Make your oral care routine aesthetic! 🤍",
    "Healthy teeth, happy life! 🌟",
    "Discover new teeth whitening hacks every day! 💎",
    "Transform your smile with us! 🌿",
    "Join our community of perfect smiles! 🪥",
    "Your dream smile is just a routine away! ✨",
    "Take your dental care to the next level! 🤍",
    "Smile brighter, live better! 🌟"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)

    topic1, topic2 = random.sample(topics, 2)
    content = random.choice(content_types)

    focus1, focus2 = random.sample(focus_areas, 2)

    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Explore {topic1} and {topic2} through {content}. Helping you achieve {focus1} and {focus2}. {closing}",

        f"{intro} Discover practical ideas for {topic1} and {topic2}. Packed with {content} for anyone interested in {focus1}. {closing}",

        f"{intro} Your source for {content}, covering everything from {topic1} to {topic2}. Build confidence in {focus1} and {focus2}. {closing}",

        f"{intro} Learn through {topic1}, {topic2}, and other {content}. Perfect for those focused on {focus1}. {closing}",

        f"{intro} We share {content} centered around {topic1} and {topic2}, helping you embrace {focus1} and {focus2}. {closing}",

        f"{intro} Find inspiration, routines, and practical ideas for {topic1} and {topic2}. Take the next step toward {focus1}. {closing}",

        f"{intro} From {topic1} to {topic2}, our {content} help make {focus1} and {focus2} a part of your daily life. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST ====
if __name__ == "__main__":
    print(generate_description())