import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🧵 Discover a world of beautiful embroidery designs and creative stitching ideas.",
    "✨ Explore inspiring embroidery patterns for makers, crafters, and creative minds.",
    "🌿 A creative collection of embroidery designs, patterns, and stitching inspiration.",
    "🪡 Discover unique embroidery artwork and designs made to inspire every project.",
    "🧵 Your source for creative embroidery patterns, designs, and stitching inspiration.",
    "✨ Explore beautiful embroidery designs and resources for creative sewing projects.",
    "🌸 Discover inspiring embroidery artwork for makers who love needle and thread.",
    "🪡 A place for embroidery inspiration, creative patterns, and beautiful stitching ideas.",
    "🎨 Explore expressive embroidery designs and creative resources for every project.",
    "🧵 Beautiful embroidery patterns and designs for modern makers and creative crafters.",
    "✨ Inspiring embroidery artwork and stitching ideas for creators of every skill level.",
    "🌈 Discover fresh embroidery ideas, patterns, and creative stitching inspiration.",
    "🚀 Creative embroidery designs that bring handmade projects to life.",
    "📚 Explore a growing collection of embroidery patterns and creative design ideas.",
    "💖 Beautiful embroidery inspiration for every creative sewing journey.",
    "🌟 Your daily source of embroidery designs and stitching inspiration.",
    "🪡 Discover detailed embroidery patterns, designs, and creative needlework ideas.",
    "💫 Unlock creative possibilities with inspiring embroidery designs and patterns.",
    "🧵 A place where embroidery meets creativity and artistic design.",
    "🎨 Curated embroidery designs and patterns for every creative journey.",
    "✨ Creative embroidery inspiration for makers who love beautiful handmade details.",
    "📖 Explore embroidery patterns and stitching resources for creative projects.",
    "💎 Discover beautiful embroidery designs for modern and traditional makers.",
    "🌍 Explore creative embroidery styles from timeless classics to modern designs.",
    "🎯 Helping creatives discover inspiring embroidery designs every day.",
    "🚀 Discover embroidery patterns that inspire memorable handmade projects.",
    "🪡 Creative embroidery designs and stitching ideas for makers and crafters.",
    "🧵 Your inspiration hub for embroidery patterns and creative needlework.",
    "✨ Explore beautiful embroidery designs and endless stitching possibilities.",
    "🌟 Endless inspiration for embroidery lovers and creative makers."
]

# ==== PROJECT TYPES ====
project_types = [
    "embroidery projects",
    "sewing projects",
    "craft projects",
    "DIY creations",
    "handmade projects",
    "creative projects",
    "needlework projects",
    "textile projects",
    "fabric projects",
    "sewing crafts",
    "creative sewing",
    "handmade creations",
    "decorative projects",
    "personal projects",
    "creative gifts",
    "home decor projects",
    "fashion projects",
    "garment projects",
    "fabric crafts",
    "textile crafts",
    "creative collections",
    "maker projects",
    "crafting ideas",
    "artistic projects",
    "creative designs",
    "handmade designs",
    "decorative crafts",
    "custom projects",
    "creative accessories",
    "textile creations",
    "sewing creations",
    "needlework creations",
    "embellishment projects",
    "creative hobbies",
    "crafting projects",
    "artistic creations",
    "creative work",
    "design projects",
    "maker creations",
    "handcrafted projects"
]

# ==== CONTENT TYPES ====
content_types = [
    "embroidery designs",
    "embroidery patterns",
    "machine embroidery designs",
    "machine embroidery patterns",
    "digital embroidery designs",
    "digital embroidery patterns",
    "embroidery resources",
    "embroidery inspiration",
    "stitching inspiration",
    "stitching designs",
    "stitching patterns",
    "needlework designs",
    "needlework patterns",
    "embroidery artwork",
    "embroidery illustrations",
    "creative embroidery",
    "embroidery collections",
    "embroidery design collections",
    "curated embroidery designs",
    "creative stitching ideas",
    "embroidery ideas",
    "sewing inspiration",
    "sewing design resources",
    "textile design inspiration",
    "fabric design ideas",
    "decorative embroidery",
    "embroidery motifs",
    "embroidery elements",
    "stitching resources",
    "creative needlework",
    "embroidery project ideas",
    "handmade embroidery ideas",
    "embroidery craft inspiration",
    "modern embroidery designs",
    "traditional embroidery inspiration",
    "artistic embroidery designs",
    "creative embroidery resources",
    "embroidery design inspiration",
    "beautiful embroidery patterns"
]

# ==== STYLES ====
styles = [
    "modern",
    "traditional",
    "artistic",
    "creative",
    "delicate",
    "decorative",
    "elegant",
    "detailed",
    "intricate",
    "minimal",
    "playful",
    "bold",
    "refined",
    "classic",
    "timeless",
    "contemporary",
    "expressive",
    "unique",
    "versatile",
    "stylish",
    "beautiful",
    "ornamental",
    "textured",
    "handcrafted",
    "artful",
    "imaginative",
    "sophisticated",
    "polished",
    "aesthetic",
    "eye-catching",
    "distinctive",
    "creative",
    "inspiring",
    "original",
    "decorative",
    "artistic",
    "maker-friendly",
    "craft-inspired",
    "detail-rich",
    "design-focused"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Follow for fresh embroidery inspiration every day. 🧵",
    "Save your favorite designs and keep creating. ✨",
    "Discover new embroidery ideas for your next project. 🪡",
    "Find inspiring patterns with every visit. 🌟",
    "Your next favorite embroidery design is waiting here. 🎨",
    "Keep exploring, stitching, creating, and inspiring. 💡",
    "Find inspiration for every embroidery journey. 🧵",
    "Bring beautiful stitching ideas into your next project. 🪡",
    "Turn creative ideas into beautiful embroidered designs. ❤️",
    "Explore more embroidery patterns and endless inspiration. 📚",
    "Your creative stitching adventure starts here. ✨",
    "Save, stitch, create, repeat. 🧵",
    "Inspiration is always one stitch away. 🌸",
    "Create something beautiful with inspiring embroidery designs. 🎨",
    "Discover embroidery patterns you'll want to save. 📌",
    "Find stitching resources for every creative vision. 💎",
    "Keep your creativity flowing with fresh embroidery ideas. 🌟",
    "Explore, stitch, create, inspire. ❤️",
    "Beautiful embroidery inspiration begins here. ✨",
    "Let your next project begin with a beautiful embroidery design. 🪡"
]

# ==== DESCRIPTION GENERATOR ====
def generate_description():
    intro = random.choice(intro_phrases)
    project1, project2 = random.sample(project_types, 2)
    content = random.choice(content_types)
    style1, style2 = random.sample(styles, 2)
    closing = random.choice(closing_phrases)

    templates = [
        f"{intro} Explore {style1} and {style2} {content}, perfect for {project1} or {project2}. {closing}",

        f"{intro} Discover {content} with a {style1} and {style2} feel, created for {project1} and {project2}. {closing}",

        f"{intro} Your source for {content} for {project1} and {project2}. Featuring beautiful {style1} and {style2} designs to inspire your creativity. {closing}",

        f"{intro} Explore {style1} and {style2} embroidery designs, ideal for {project1} as well as {project2}. Discover fresh {content} every day. {closing}",

        f"{intro} Beautiful {style1} and {style2} embroidery designs curated for {project1} and {project2}. Explore inspiring {content} and elevate your creative work. {closing}",

        f"{intro} Explore {content} built around {style1} and {style2} design styles. Perfect for {project1} or {project2}. {closing}",

        f"{intro} Handpicked {style1} and {style2} embroidery designs for {project1} & {project2}, plus {content} to keep you inspired. {closing}"
    ]

    return random.choice(templates)


# ==== RUN TEST IF FILE EXECUTED DIRECTLY ====
if __name__ == "__main__":
    print(generate_description())