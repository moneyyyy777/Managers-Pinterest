import random

# ====== ПРИЛАГАТЕЛЬНЫЕ (NERVOUS SYSTEM CALM - БЕЗ НЕГАТИВА) ======
adjectives = [
    "Vagus", "Somatic", "Neural", "Central", "Autonomic", "Grounded", "Regulated", 
    "Balanced", "Soothed", "Calm", "Parasympathetic", "Healing", "Restorative", 
    "Centered", "Harmonic", "Resilient", "Gentle", "Holistic", "Nourishing", 
    "Pure", "Organic", "Natural", "Still", "Mindful", "Vibrant", "Synaptic", 
    "Sensory", "Quiet", "Vital", "Flowing", "Ethereal", "Ambient", "Serene", 
    "Peaceful", "Tranquil", "Sound", "Rested", "Aura", "Balanced", "Aligned"
] * 4  # умножаем список для расширения базы при генерации

# ====== СУЩЕСТВИТЕЛЬНЫЕ (CNS & REGULATION CORE) ======
nouns = [
    "Nerve", "CNS", "Vagus", "Regulation", "Reset", "Balance", "Somatics", 
    "Sync", "Harmony", "Pathway", "Synapse", "Flow", "Healing", "Wellness", 
    "Stillness", "Breath", "Tone", "Connection", "System", "Method", 
    "Blueprint", "Solutions", "Guide", "Apothecary", "Herbs", "Botanicals", 
    "Rituals", "Habits", "Routines", "Haven", "Sanctuary", "Retreat", 
    "Academy", "Club", "Hub", "Lab", "Journey", "Knowledge", "Living", "Lifestyle"
] * 4

# ====== МОДИФИКАТОРЫ ======
modifiers = [
    "Pro", "Elite", "Lab", "Club", "Academy", "Studio", "Works", 
    "Blueprint", "Method", "System", "Framework", "Collective", 
    "Network", "Hub", "Expert", "Guide", "Nation", "Alliance", "HQ", "Masters"
] * 2

# ====== СВЯЗКИ ======
connectors = ["of", "&", "for", "-", "x", "to"]

# ====== ГЕНЕРАТОР ======
def generate_brand_name():
    structures = [
        # Простые и научные (например, "Vagus Reset", "Somatic Flow")
        f"{random.choice(adjectives)} {random.choice(nouns)}",

        # Премиум-бренды (например, "Neural Balance Academy", "Regulated CNS Lab")
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(modifiers)}",

        # Экспертные названия (например, "Somatics Method", "Vagus Blueprint")
        f"{random.choice(nouns)} {random.choice(modifiers)}",

        # Двойные велнес-комбинации (например, "Parasympathetic Sync & Calm Pathway")
        f"{random.choice(adjectives)} {random.choice(nouns)} {random.choice(connectors)} {random.choice(adjectives)} {random.choice(nouns)}",

        # Тематические связки (например, "Herbs for Vagus", "Solutions to Reset")
        f"{random.choice(nouns)} {random.choice(connectors)} {random.choice(nouns)}",

        # Короткие и легкие варианты
        f"{random.choice(adjectives)} {random.choice(nouns)}"
    ]

    return random.choice(structures)

# ====== ТЕСТ ======
if __name__ == "__main__":
    # Выведем 10 случайных имен для проверки генерации
    print("Примеры сгенерированных имен аккаунтов (Нервная система без негатива):")
    for _ in range(10):
        print(f"- {generate_brand_name()}")