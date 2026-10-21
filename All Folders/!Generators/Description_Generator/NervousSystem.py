import random

# ==== INTRO PHRASES (Вводные фразы - Биология + Антистресс) ====
intro_phrases = [
    "🌿 Welcome to your dedicated space for nervous system regulation and somatic peace!",
    "⚡ Discover the science of calming your central nervous system naturally!",
    "🧠 Your daily source of neural balance, vagus nerve tone, and somatic harmony!",
    "🧬 Explore how to activate your parasympathetic nervous system for deep calm!",
    "🌱 Learn the art and science of somatic healing and autonomic balance!",
    "✨ Join a community focused on neuro-restoration and mind-body harmony!",
    "🧘 Guided somatic routines and herbal nervines to reset your physical biology!",
    "🧬 Practical knowledge for brain-body optimization and deep somatic relaxation!",
    "🪴 Helping you build neural resilience, vagus nerve strength, and cellular peace!",
    "🌿 Discover natural solutions for a calm, balanced, and regulated nervous system!"
]

# ==== NERVOUS SYSTEM TOPICS (Темы, о которых пишем - без негатива) ====
topics = [
    "vagus nerve regulation",
    "somatic healing techniques",
    "parasympathetic activation",
    "autonomic nervous system balance",
    "neural pathway restoration",
    "central nervous system reset",
    "myelin support habits",
    "neurogenesis nutrients",
    "vagus nerve tone methods",
    "somatic calming practices",
    "synaptic relaxation",
    "nature-based nervines",
    "mind-body biofeedback",
    "calming brain wave tips",
    "cortical relaxation",
    "sensory grounding rituals",
    "neuroplasticity for peace",
    "somatic release exercises",
    "herbal nervine guides",
    "autonomic nervous system care"
]

# ==== CONTENT TYPES (Типы контента) ====
content_types = [
    "somatic tutorials",
    "step-by-step resets",
    "vagus nerve checklists",
    "expert neural advice",
    "inspiring somatic ideas",
    "nervous system blueprints",
    "beginner biohacking tips",
    "neural regulation guides",
    "deep relaxation techniques",
    "parasympathetic blueprints",
    "easy somatic routines",
    "herbal nerve care guides"
]

# ==== FOCUS AREAS (Главные цели и результаты) ====
focus_areas = [
    "regulating your nervous system",
    "soothing your physical body",
    "optimizing your neural pathways",
    "strengthening vagus nerve tone",
    "achieving autonomic balance",
    "cultivating deep sensory peace",
    "natural nervous system support",
    "restoring synaptic balance",
    "building neural resilience",
    "somatic brain-body harmony"
]

# ==== CLOSING PHRASES (Призывы к действию) ====
closing_phrases = [
    "Follow us for daily somatic and nervous system inspiration! 🌿",
    "Start your journey toward a regulated and resilient mind-body! ✨",
    "Join thousands learning the science of autonomic calm! 🧠",
    "Your path to a deeply regulated nervous system begins here! ⚡",
    "Calm your nerves, soothe your pathways, and thrive! 🌱",
    "Learn something new to balance your biology every day! 🧬",
    "A balanced life begins with a regulated nervous system — follow along! 🧘",
    "Create a more resilient and biologically peaceful future! 🌾",
    "Discover the freedom of a quiet, aligned central nervous system! 🧠",
    "Let's master the art of nervous system regulation together! 🏡"
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

        f"{intro} Learn valuable sleep skills through {topic1}, {topic2}, and other {content}. Perfect for those pursuing {focus1}. {closing}",

        f"{intro} We share {content} focused on {topic1} and {topic2}, helping you create a lifestyle centered around {focus1} and {focus2}. {closing}",

        f"{intro} Find inspiration, {content}, and proven ideas for {topic1} and {topic2}. Take the next step toward {focus1}. {closing}",

        f"{intro} From {topic1} to {topic2}, our {content} help make {focus1} and {focus2} achievable for everyone. {closing}"
    ]

    return random.choice(templates)

# ==== RUN TEST ====
if __name__ == "__main__":
    print("Примеры сгенерированных описаний:")
    print("-" * 50)
    for i in range(3):
        print(f"Вариант {i+1}:")
        print(generate_description())
        print("-" * 50)