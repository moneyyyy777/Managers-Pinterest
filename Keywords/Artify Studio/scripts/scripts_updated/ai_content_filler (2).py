import os
import re
import time
import sys
import warnings

# Игнорируем лишние предупреждения в консоли
warnings.filterwarnings("ignore", category=FutureWarning)

try:
    import openpyxl
except ImportError:
    print("Установи openpyxl: pip install openpyxl")
    sys.exit(1)

try:
    import google.generativeai as genai
except ImportError:
    print("Установи google-generativeai: pip install google-generativeai")
    sys.exit(1)

# ─── НАСТРОЙКИ ───────────────────────────────────────────────────────────────

# Твой API Ключ
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyD7NWc9j6985BY5kpO522z2wS1I-HTAoBo")

# Модель (flash — быстрее, pro — умнее). 
# Используем flash-latest для лучшей поддержки инструментов.
MODEL_NAME = "gemini-1.5-flash-latest" 

START_ROW   = 3       # первая строка для записи
END_ROW     = 5001    # последняя строка включительно
COL_DESC    = 12      # L — description_template
COL_CTA     = 13      # M — CTA
COL_TITLE   = 14      # N — title

RETRY_ATTEMPTS = 3    
RETRY_DELAY    = 10   

# ─────────────────────────────────────────────────────────────────────────────

def read_txt(path: str) -> str:
    if not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read().strip()

def parse_block(text: str, marker: str) -> list[str]:
    pattern = re.compile(
        rf'{marker}.*?```[^\n]*\n(.*?)```',
        re.DOTALL | re.IGNORECASE
    )
    m = pattern.search(text)
    if m:
        raw = m.group(1)
    else:
        parts = re.split(
            r'(?:100\s+ЗАГОЛОВКОВ|100\s+ОПИСАНИЙ|100\s+ПРИЗЫВОВ)',
            text, flags=re.IGNORECASE
        )
        idx = 0
        for i, p in enumerate(parts):
            if marker.lower().replace(r'\s+', ' ') in p.lower():
                idx = i
                break
        raw = parts[idx] if idx < len(parts) else ""

    lines = []
    for line in raw.splitlines():
        line = line.strip()
        line = re.sub(r'^\d+[\.\)]\s*', '', line)
        if line:
            lines.append(line)
    return lines

def call_gemini(prompt: str) -> str:
    """Вызывает Gemini API с включенным инструментом Google Search (Grounding)."""
    genai.configure(api_key=GEMINI_API_KEY)
    
    # Включаем инструменты поиска Google для возможности посещения ссылок
    tools = [{"google_search_retrieval": {}}]
    
    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        tools=tools
    )

    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7, # Чуть ниже для стабильности
                    max_output_tokens=8192,
                )
            )
            if not response.text:
                raise ValueError("Пустой ответ от API")
            return response.text
        except Exception as e:
            print(f"    [!] Ошибка API (попытка {attempt}/{RETRY_ATTEMPTS}): {e}")
            if attempt < RETRY_ATTEMPTS:
                time.sleep(RETRY_DELAY)
            else:
                raise

def build_prompt(link: str, tags: str, board_name: str) -> str:
    return f"""Привет. Я продвигаю на Pinterest товар.
Ссылка на сайт (детально изучи данный сайт, чтобы понять что пользователь получит когда перейдет на данный сайт с фото Pinterest): {link}
Теги по которым продвигаюсь (используй их как контекст для ключевых слов, не вставляй теги дословно в тексты):
{tags}
Главный тег доски: {board_name}
Сделай:
1) 100 ЗАГОЛОВКОВ (без эмодзи, без знаков препинания в конце, 3-8 слов, содержат ключевые слова из тегов естественно вписанные)
2) 100 ОПИСАНИЙ (с эмодзи по смыслу в начале предложения, без артикля "A" в начале, без призыва к действию внутри, включай слово FREE или подобное по смыслу не только в конец но и в середину, 1-2 предложения максимум, должны подходить к ЛЮБОЙ картинке из выдачи по данным тегам)
3) 100 ПРИЗЫВОВ К ДЕЙСТВИЮ — CTA (с эмодзи по смыслу, одно короткое предложение, призыв перейти на сайт за товаром, разные формулировки — не повторяться)
ВАЖНЫЕ ПРАВИЛА:
- Любой заголовок + любое описание + любой CTA должны сочетаться друг с другом
- Все тексты в рамках тематики тегов и товара, без выхода за рамки
- Каждый список помести в отдельный блок кода
- Без нумерации, без пустых строк между строками
- Только сами тексты, ничего лишнего"""

def fill_xlsx(xlsx_path: str, titles: list, descriptions: list, ctas: list):
    wb = openpyxl.load_workbook(xlsx_path)
    ws = wb.active
    total_rows = END_ROW - START_ROW + 1

    print(f"    Записываю {total_rows} строк...")

    for i in range(total_rows):
        row = START_ROW + i
        ws.cell(row=row, column=COL_DESC).value  = descriptions[i % len(descriptions)]
        ws.cell(row=row, column=COL_CTA).value   = ctas[i % len(ctas)]
        ws.cell(row=row, column=COL_TITLE).value = titles[i % len(titles)]

    wb.save(xlsx_path)
    print(f"    ✅ Сохранено: {os.path.basename(xlsx_path)}")

def process_strategy_folder(strategy_path: str, strategy_name: str):
    xlsx_file = None
    for f in os.listdir(strategy_path):
        if f.endswith(".xlsx") and not f.startswith("~$"):
            xlsx_file = os.path.join(strategy_path, f)
            break

    if not xlsx_file:
        return

    for_main = os.path.join(strategy_path, "For Main")
    link      = read_txt("linksite.txt")
    tags      = read_txt(os.path.join(for_main, "Boards_Tags.txt"))
    board_name = read_txt(os.path.join(for_main, "Boards_Name.txt"))

    if not all([link, tags, board_name]):
        print(f"    ⚠️ Пропуск {strategy_name}: не хватает данных в .txt файлах")
        return

    print(f"    🔗 Анализируем: {link}")
    print(f"    🤖 Работает Gemini ({MODEL_NAME})...")

    prompt = build_prompt(link, tags, board_name)
    raw_response = call_gemini(prompt)

    titles       = parse_block(raw_response, r'100\s+ЗАГОЛОВКОВ')
    descriptions = parse_block(raw_response, r'100\s+ОПИСАНИЙ')
    ctas         = parse_block(raw_response, r'100\s+ПРИЗЫВОВ')

    if len(titles) < 5 or len(descriptions) < 5:
        print(f"    ❌ Ошибка парсинга. Ответ сохранен в ai_debug.txt")
        with open("ai_debug.txt", "w") as f: f.write(raw_response)
        return

    input(f"    📊 Получено: T:{len(titles)}, D:{len(descriptions)}, C:{len(ctas)}")
    fill_xlsx(xlsx_file, titles, descriptions, ctas)

def main():
    product_path = os.path.dirname(os.path.abspath(__file__))
    niche_folders = sorted([d for d in os.listdir(product_path) if os.path.isdir(os.path.join(product_path, d)) and not d.startswith('.')])

    for niche_name in niche_folders:
        niche_path = os.path.join(product_path, niche_name)
        strategy_folders = sorted([d for d in os.listdir(niche_path) if os.path.isdir(os.path.join(niche_path, d)) and re.match(r'^\d+', d)])

        for strategy_name in strategy_folders:
            print(f"\n🚀 Стратегия: {niche_name} -> {strategy_name}")
            try:
                process_strategy_folder(os.path.join(niche_path, strategy_name), strategy_name)
                time.sleep(2) # Пауза для лимитов API
            except Exception as e:
                print(f"    ❌ Ошибка: {e}")

if __name__ == "__main__":
    main()