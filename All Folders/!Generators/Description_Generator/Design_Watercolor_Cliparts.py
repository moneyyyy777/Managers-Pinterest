import random

# ==== INTRO PHRASES ====
intro_phrases = [
    "🎨 Discover beautiful hand-painted clipart inspired by the art of painting.",
    "✨ Explore watercolor, gouache, and pastel clipart with an artistic handmade feel.",
    "🌸 A creative collection of hand-painted illustrations and artistic clipart.",
    "🖌️ Discover painterly clipart created with soft colors, artistic textures, and handmade charm.",
    "🎨 Your source for watercolor, gouache, pastel, and hand-painted design inspiration.",
    "✨ Explore artistic clipart that brings the feeling of a painted artwork to every project.",
    "🌿 Beautiful painted illustrations and creative clipart for artistic projects.",
    "🖼️ Discover clipart inspired by watercolor paintings, gouache artwork, and traditional art.",
    "🎨 Hand-painted graphics with beautiful textures, expressive brushwork, and artistic character.",
    "🖌️ Explore soft, artistic clipart created to feel like it was painted by hand.",
    "✨ Inspiring watercolor and gouache artwork for creative minds and visual projects.",
    "🌈 Discover painterly illustrations filled with soft colors, texture, and artistic details.",
    "🎨 Creative clipart inspired by traditional painting techniques and handmade artwork.",
    "💫 Explore beautifully painted graphics with a natural, artistic, and handcrafted feel.",
    "🖌️ A collection of watercolor, gouache, pastel, and painterly clipart.",
    "🎨 Discover artistic illustrations that capture the beauty of handmade painting.",
    "✨ Soft, expressive, and beautifully painted clipart for every creative idea.",
    "🖼️ Explore hand-painted graphics inspired by watercolor, gouache, and pastel art.",
    "🌸 A place for artistic clipart, painted illustrations, and beautiful visual inspiration.",
    "🎨 Discover clipart with the texture, warmth, and charm of traditional artwork.",
    "🖌️ Hand-painted inspiration for creators who love beautiful artistic details.",
    "✨ Explore painterly clipart made to bring an authentic handmade feeling to your designs.",
    "🎨 Beautiful artwork-inspired clipart for creative projects, crafts, and visual design.",
    "🌿 Discover soft watercolor, textured gouache, and delicate pastel artwork.",
    "🖼️ Artistic clipart inspired by the feeling of sitting down and painting by hand.",
    "🎨 Explore creative illustrations with natural brushwork, painted textures, and soft tones.",
    "✨ Hand-painted artwork and clipart for designers, makers, and creative minds.",
    "🖌️ Discover expressive painted illustrations with an authentic handmade aesthetic.",
    "🎨 Your inspiration hub for watercolor, gouache, pastel, and artistic clipart.",
    "🌟 Endless inspiration for lovers of hand-painted art and beautiful creative graphics."
]

# ==== PROJECT TYPES ====
project_types = [
    "creative projects",
    "artistic projects",
    "craft projects",
    "DIY creations",
    "digital designs",
    "print projects",
    "creative branding",
    "visual projects",
    "content creation",
    "social media designs",
    "marketing materials",
    "personal projects",
    "creative businesses",
    "small business projects",
    "artistic creations",
    "digital artwork",
    "visual storytelling",
    "decorative projects",
    "creative compositions",
    "printable projects",
    "digital creations",
    "creative collections",
    "product designs",
    "packaging designs",
    "editorial projects",
    "creative layouts",
    "visual content",
    "artistic designs",
    "creative materials",
    "maker projects",
    "handmade projects",
    "paper crafts",
    "stationery projects",
    "decorative designs",
    "creative gifts",
    "personal artwork",
    "inspiring projects",
    "creative ideas",
    "art-focused projects",
    "design projects"
]

# ==== CONTENT TYPES ====
content_types = [
    "watercolor clipart",
    "hand-painted clipart",
    "gouache clipart",
    "pastel clipart",
    "painted clipart",
    "artistic clipart",
    "painterly clipart",
    "watercolor illustrations",
    "gouache illustrations",
    "pastel illustrations",
    "hand-painted illustrations",
    "painted illustrations",
    "artistic illustrations",
    "painterly illustrations",
    "watercolor artwork",
    "gouache artwork",
    "pastel artwork",
    "hand-painted artwork",
    "painted artwork",
    "artistic artwork",
    "traditional art inspiration",
    "painted graphics",
    "hand-painted graphics",
    "watercolor graphics",
    "gouache graphics",
    "artistic graphics",
    "painterly graphics",
    "painted design elements",
    "artistic design elements",
    "hand-painted elements",
    "watercolor elements",
    "gouache elements",
    "pastel elements",
    "artistic resources",
    "painted resources",
    "watercolor resources",
    "creative painted resources",
    "hand-painted design resources",
    "artistic clipart collections",
    "painted illustration collections"
]

# ==== STYLES ====
styles = [
    "watercolor",
    "hand-painted",
    "gouache",
    "pastel",
    "painterly",
    "artistic",
    "expressive",
    "soft",
    "delicate",
    "dreamy",
    "natural",
    "organic",
    "textured",
    "handcrafted",
    "traditional",
    "authentic",
    "creative",
    "artistic",
    "whimsical",
    "gentle",
    "subtle",
    "romantic",
    "delicate",
    "colorful",
    "soft-toned",
    "muted",
    "airy",
    "warm",
    "organic",
    "rustic",
    "vintage-inspired",
    "timeless",
    "elegant",
    "expressive",
    "imaginative",
    "dreamy",
    "artful",
    "handmade",
    "artist-inspired"
]

# ==== CLOSING PHRASES ====
closing_phrases = [
    "Follow for fresh watercolor inspiration every day. 🎨",
    "Save your favorite painted artwork and keep creating. ✨",
    "Discover beautiful hand-painted ideas for your next project. 🖌️",
    "Find new watercolor and gouache inspiration with every visit. 🌸",
    "Your next favorite piece of painted clipart is waiting here. 🎨",
    "Keep exploring, painting, creating, and inspiring. 💫",
    "Find artistic inspiration for every creative project. 🌿",
    "Bring the beauty of hand-painted artwork into your next design. 🖌️",
    "Turn creative ideas into beautiful painted designs. 🎨",
    "Explore more watercolor, gouache, and pastel inspiration. 📚",
    "Your artistic adventure starts here. ✨",
    "Save, create, and let your imagination flow. 🎨",
    "Inspiration is always one beautiful brushstroke away. 🖌️",
    "Create with the warmth and charm of handmade artwork. 🌸",
    "Bring painterly beauty to your creative projects. 🎨",
    "Discover painted clipart you'll want to save. 📌",
    "Find artistic resources for every creative vision. 💎",
    "Keep your creativity flowing with beautiful painted artwork. 🌟",
    "Explore, create, paint, inspire. ❤️",
    "Beautiful hand-painted inspiration begins here. ✨"
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

        f"{intro} Your source for {content} for {project1} and {project2}. Featuring beautiful {style1} and {style2} artwork to inspire your creativity. {closing}",

        f"{intro} Explore {style1} and {style2} painted artwork, ideal for {project1} as well as {project2}. Discover fresh {content} every day. {closing}",

        f"{intro} Beautiful {style1} and {style2} artwork curated for {project1} and {project2}. Explore inspiring {content} and bring an artistic touch to your work. {closing}",

        f"{intro} Explore {content} created around {style1} and {style2} artistic styles. Perfect for {project1} or {project2}. {closing}",

        f"{intro} Handpicked {style1} and {style2} clipart, illustrations, and painted graphics for {project1} & {project2}. Discover beautiful {content} along the way. {closing}"
    ]

    return random.choice(templates)


# ==== RUN TEST IF FILE EXECUTED DIRECTLY ====
if __name__ == "__main__":
    print(generate_description())