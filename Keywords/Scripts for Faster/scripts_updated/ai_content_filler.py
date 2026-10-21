"""
ai_content_filler.py
────────────────────
Клади в папку продукта (рядом с нишевыми подпапками).

Что делает:
  - Обходит все нишевые подпапки → внутри каждой ищет папки стратегий (начинаются с цифры)
  - В каждой папке стратегии находит .xlsx файл
  - Читает For Main/Link_Site.txt, For Main/Boards_Tags.txt, For Main/Boards_Name.txt
  - Отправляет промпт в Google AI Studio (Gemini API)
  - Парсит 100 заголовков / 100 описаний / 100 CTA из ответа
  - Заполняет столбцы N (title), L (description_template), M (CTA)
    начиная со строки 3 и протягивая циклически до строки 5001
  - Строки 1 и 2 не трогает

Настройка:
  1. pip install openpyxl google-generativeai
  2. Вставь свой API ключ в GEMINI_API_KEY ниже
     (или задай переменную окружения GEMINI_API_KEY)
"""

import os
import re
import time
import sys

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

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "ВСТАВЬ_СВОЙ_КЛЮЧ_СЮДА")

MODEL_NAME = "gemini-1.5-pro-latest"   # или "gemini-1.5-flash" — быстрее/дешевле

START_ROW   = 3       # первая строка для записи (1 и 2 не трогаем)
END_ROW     = 5001    # последняя строка включительно
COL_DESC    = 12      # L — description_template
COL_CTA     = 13      # M — CTA
COL_TITLE   = 14      # N — title

RETRY_ATTEMPTS = 3    # сколько раз повторить при ошибке API
RETRY_DELAY    = 1  # секунд между попытками

# ─────────────────────────────────────────────────────────────────────────────


def read_txt(path: str) -> str:
    """Читает текстовый файл, возвращает содержимое или пустую строку."""
    if not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read().strip()


def parse_block(text: str, marker: str) -> list[str]:
    """
    Ищет блок кода после маркера (ЗАГОЛОВКОВ / ОПИСАНИЙ / ПРИЗЫВОВ).
    Возвращает список строк без пустых строк и нумерации.
    """
    # Пробуем найти ```...``` блок после маркера
    pattern = re.compile(
        rf'{marker}.*?```[^\n]*\n(.*?)```',
        re.DOTALL | re.IGNORECASE
    )
    m = pattern.search(text)
    if m:
        raw = m.group(1)
    else:
        # Fallback: берём всё между маркером и следующим маркером или концом
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
        # Убираем нумерацию типа "1." "1)" "1 "
        line = re.sub(r'^\d+[\.\)]\s*', '', line)
        if line:
            lines.append(line)
    return lines


def call_gemini(prompt: str) -> str:
    """Вызывает Gemini API и возвращает текст ответа."""
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(MODEL_NAME)

    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.9,
                    max_output_tokens=8192,
                )
            )
            return response.text
        except Exception as e:
            print(f"    [!] Ошибка API (попытка {attempt}/{RETRY_ATTEMPTS}): {e}")
            if attempt < RETRY_ATTEMPTS:
                print(f"    Жду {RETRY_DELAY} сек...")
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
    """Заполняет столбцы L, M, N в xlsx файле начиная со строки START_ROW до END_ROW."""
    wb = openpyxl.load_workbook(xlsx_path)
    ws = wb.active

    total_rows = END_ROW - START_ROW + 1  # 4999 строк

    print(f"    Записываю строки {START_ROW}–{END_ROW} ({total_rows} строк)...")

    for i in range(total_rows):
        row = START_ROW + i

        ws.cell(row=row, column=COL_DESC).value  = descriptions[i % len(descriptions)]
        ws.cell(row=row, column=COL_CTA).value   = ctas[i % len(ctas)]
        ws.cell(row=row, column=COL_TITLE).value = titles[i % len(titles)]

    wb.save(xlsx_path)
    print(f"    ✅ Сохранено: {os.path.basename(xlsx_path)}")


def process_strategy_folder(strategy_path: str, strategy_name: str):
    """Обрабатывает одну папку стратегии."""

    # Находим xlsx файл
    xlsx_file = None
    for f in os.listdir(strategy_path):
        if f.endswith(".xlsx") and not f.startswith("~$"):
            xlsx_file = os.path.join(strategy_path, f)
            break

    if not xlsx_file:
        print(f"    ⚠️  xlsx не найден в: {strategy_name} — пропускаем")
        return

    for_main = os.path.join(strategy_path, "For Main")
    link      = read_txt(os.path.join(for_main, "Link_Site.txt"))
    tags      = read_txt(os.path.join(for_main, "Boards_Tags.txt"))
    board_name = read_txt(os.path.join(for_main, "Boards_Name.txt"))

    if not link:
        print(f"    ⚠️  Link_Site.txt пуст или не найден в: {strategy_name} — пропускаем")
        return
    if not tags:
        print(f"    ⚠️  Boards_Tags.txt пуст в: {strategy_name} — пропускаем")
        return
    if not board_name:
        print(f"    ⚠️  Boards_Name.txt пуст в: {strategy_name} — пропускаем")
        return

    print(f"    Главный тег: {board_name}")
    print(f"    Ссылка: {link}")
    print(f"    Вызываю Gemini API...")

    prompt = build_prompt(link, tags, board_name)
    raw_response = call_gemini(prompt)

    # Парсим блоки
    titles       = parse_block(raw_response, r'100\s+ЗАГОЛОВКОВ')
    descriptions = parse_block(raw_response, r'100\s+ОПИСАНИЙ')
    ctas         = parse_block(raw_response, r'100\s+ПРИЗЫВОВ')

    print(f"    Получено: {len(titles)} заголовков, {len(descriptions)} описаний, {len(ctas)} CTA")

    # Проверка минимального количества
    if len(titles) < 10 or len(descriptions) < 10 or len(ctas) < 10:
        print(f"    ❌ Слишком мало данных от API — пропускаем запись. Проверь ответ вручную.")
        debug_path = os.path.join(strategy_path, "ai_debug_response.txt")
        with open(debug_path, "w", encoding="utf-8") as f:
            f.write(raw_response)
        print(f"    Ответ сохранён для отладки: ai_debug_response.txt")
        return

    fill_xlsx(xlsx_file, titles, descriptions, ctas)


def main():
    # Папка продукта = папка где лежит скрипт
    product_path = os.path.dirname(os.path.abspath(__file__))
    product_name = os.path.basename(product_path)

    print(f"{'=' * 60}")
    print(f"  ai_content_filler | Продукт: {product_name}")
    print(f"{'=' * 60}")

    if GEMINI_API_KEY == "ВСТАВЬ_СВОЙ_КЛЮЧ_СЮДА":
        print("❌ Вставь GEMINI_API_KEY в скрипт или задай переменную окружения!")
        input("Нажмите Enter, чтобы выйти...")
        return

    # Находим нишевые подпапки
    niche_folders = sorted([
        d for d in os.listdir(product_path)
        if os.path.isdir(os.path.join(product_path, d)) and not d.startswith('.')
    ])

    if not niche_folders:
        print("Нишевые подпапки не найдены.")
        input("Нажмите Enter, чтобы выйти...")
        return

    total_processed = 0
    total_skipped   = 0

    for niche_name in niche_folders:
        niche_path = os.path.join(product_path, niche_name)

        # Папки стратегий (начинаются с цифры)
        strategy_folders = sorted([
            d for d in os.listdir(niche_path)
            if os.path.isdir(os.path.join(niche_path, d)) and re.match(r'^\d+', d)
        ], key=lambda x: int(re.match(r'^\d+', x).group()))

        if not strategy_folders:
            continue

        print(f"\n{'─' * 60}")
        print(f"  Ниша: {niche_name}  ({len(strategy_folders)} стратегий)")
        print(f"{'─' * 60}")

        for strategy_name in strategy_folders:
            strategy_path = os.path.join(niche_path, strategy_name)
            print(f"\n  [{strategy_name}]")

            try:
                process_strategy_folder(strategy_path, strategy_name)
                total_processed += 1
            except Exception as e:
                print(f"    ❌ Ошибка: {e}")
                total_skipped += 1

            # Небольшая пауза между запросами чтобы не перегружать API
            time.sleep(3)

    print(f"\n{'=' * 60}")
    print(f"  Готово! Обработано: {total_processed}  |  Пропущено: {total_skipped}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
    input("\nНажмите Enter, чтобы выйти...")
