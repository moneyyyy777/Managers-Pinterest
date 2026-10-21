import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🐶✨ Welcome to the world of happy and healthy dogs!",
    "🐾 Discover everything your dog needs to live its best life!",
    "❤️ A place where every dog gets the care and love it deserves!",
    "🌟 Your daily source of dog care tips and inspiration!",
    "🐕 Explore the secrets to raising a well-trained and happy dog!",
    "💡 Everything about dogs — from training to grooming and beyond!",
    "🎯 Helping you become the best dog owner possible!",
    "🐶 Tips, tricks, and love for every dog parent!",
    "📚 Learn how to care, train, and understand your dog better!",
    "✨ Because every dog deserves the best life!",
    "🐾 Build a stronger bond with your furry friend!",
    "💬 Smart tips for smarter dog parenting!",
    "🐕 From puppy to senior — we’ve got you covered!",
    "🚀 Take your dog care skills to the next level!",
    "❤️ Make every moment with your dog even more special!",
    "🐶 Everything you need for a happy, well-behaved dog!",
    "💎 Trusted advice for dog lovers and owners!",
    "📌 Your go-to source for dog knowledge and care!",
    "💫 Better care starts with better knowledge!",
    "🎉 Raising dogs made easier and more enjoyable!"
]

# ==== DOG TOPICS ====
dog_topics = [
    "puppy training", "obedience training", "dog grooming", "dog nutrition",
    "dog health care", "behavior correction", "socialization",
    "exercise routines", "mental stimulation", "dog hygiene",
    "feeding routines", "positive reinforcement training",
    "crate training", "leash training", "dog bonding",
    "home dog care", "dog safety", "senior dog care",
    "puppy development", "dog habits", "dog lifestyle",
    "pet parenting", "dog wellness", "daily dog routine"
]

# ==== CONTENT TYPES ====
content_types = [
    "expert tips", "step-by-step guides", "training techniques",
    "care routines", "life hacks", "practical advice",
    "easy-to-follow methods", "daily routines",
    "behavior insights", "must-know tips",
    "beginner-friendly guides", "advanced techniques",
    "proven strategies", "helpful checklists",
    "real-life solutions"
]

# ==== DOG TYPES / STYLES ====
dog_types = [
    "playful", "active", "small breed", "large breed", "energetic",
    "calm", "family-friendly", "puppies", "adult dogs",
    "senior dogs", "indoor dogs", "outdoor dogs",
    "working dogs", "companion dogs", "rescued dogs",
    "high-energy", "low-maintenance", "sensitive dogs"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Follow for more dog care tips! 🐾",
    "Make your dog happier every day! ❤️",
    "Build a stronger bond with your dog! 🐶",
    "Your dog deserves the best — start today! ✨",
    "Learn something new about dogs every day! 📌",
    "Happy dog, happy life! 🐕",
    "Turn knowledge into better care! 💡",
    "Because every dog matters! 🐾",
    "Take your dog parenting to the next level! 🚀",
    "Better care starts here! 🐶"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    topic1, topic2 = random.sample(dog_topics, 2)
    content = random.choice(content_types)
    type1, type2 = random.sample(dog_types, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Discover {content} for {topic1} and {topic2}, perfect for {type1} and {type2}. {closing}",
        f"{intro} Learn {topic1} and {topic2} with {content}, tailored for {type1} and {type2}. {closing}",
        f"{intro} Your guide to {topic1} and {topic2}. Packed with {content} for {type1} and {type2}. {closing}",
        f"{intro} From {topic1} to {topic2}, explore {content} designed for {type1} and {type2}. {closing}",
        f"{intro} Master {topic1} and {topic2} with {content}, ideal for {type1} and {type2}. {closing}",
        f"{intro} Explore {content} around {topic1} and {topic2}, perfect for {type1} & {type2}. {closing}",
        f"{intro} Everything about {topic1} and {topic2} with {content} for {type1} and {type2}. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST ====
if __name__ == "__main__":
    print(generate_description())