import os

with open("PROMPT_TEMPLATES.md", "r") as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if line.startswith("### 1.2. Автономная версия (Оркестратор: Сбор ниш, Семена, Структура)"):
        start_idx = i
    if line.startswith("## 2. Отбор тегов (Фильтрация мусора) - Старая ручная версия"):
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    with open("PROMPT_GEMINI_ANTIGRAVITY_SEED_TAGS.md", "r") as f:
        new_content = f.read()

    new_section = "### 1.2. Автономная версия (Оркестратор: Сбор ниш, Семена, Структура)\n\n"
    new_section += "```text\n"
    new_section += new_content
    new_section += "\n```\n\n"
    
    new_lines = lines[:start_idx] + [new_section] + lines[end_idx:]
    
    with open("PROMPT_TEMPLATES.md", "w") as f:
        f.writelines(new_lines)
    print("Successfully replaced.")
else:
    print("Could not find boundaries.")
