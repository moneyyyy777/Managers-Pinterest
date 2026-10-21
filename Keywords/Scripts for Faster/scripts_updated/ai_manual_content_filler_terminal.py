import os
import re
import sys
import openpyxl

# ─── НАСТРОЙКИ ───────────────────────────────────────────────────────────────

START_ROW = 3  # первая строка для записи
END_ROW = 5001  # последняя строка включительно
COL_DESC = 12  # L
COL_CTA = 13  # M
COL_TITLE = 14  # N


# ─────────────────────────────────────────────────────────────────────────────

def read_txt(path: str) -> str:
    """Читает текстовый файл."""
    if not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read().strip()


def get_clean_list(label: str) -> list[str]:
    """Запрашивает ввод блока текста и очищает его от мусора и нумерации."""
    print(f"\n📥 [ШАГ] Вставьте {label}")
    print(f"👉 Вставьте список из AI. В конце введите 'SAVE' с новой строки и нажмите Enter:")

    raw_lines = []
    while True:
        line = input()
        if line.strip().upper() == "SAVE":
            break
        raw_lines.append(line)

    clean_lines = []
    for line in raw_lines:
        line = line.strip()
        # Убираем нумерацию (1., 1), -, *) и блоки кода ```
        line = re.sub(r'^\d+[\.\)]\s*|^[*\-•]\s*|^`{3,}', '', line)
        line = line.replace("```", "").strip()
        if line:
            clean_lines.append(line)

    print(f"✅ Получено строк: {len(clean_lines)}")
    return clean_lines


def fill_xlsx(xlsx_path: str, titles: list, descriptions: list, ctas: list):
    """Заполняет Excel."""
    print(f"\n✍️ Записываю в Excel: {os.path.basename(xlsx_path)}...")
    wb = openpyxl.load_workbook(xlsx_path)
    ws = wb.active
    total_rows = END_ROW - START_ROW + 1

    for i in range(total_rows):
        row = START_ROW + i
        ws.cell(row=row, column=COL_DESC).value = descriptions[i % len(descriptions)]
        ws.cell(row=row, column=COL_CTA).value = ctas[i % len(ctas)]
        ws.cell(row=row, column=COL_TITLE).value = titles[i % len(titles)]

    wb.save(xlsx_path)
    print(f"✨ Готово! Файл сохранен.")


def build_prompt(link: str, tags: str, board_name: str) -> str:
    return f"""Привет. Я продвигаю на Pinterest товар.
Ссылка на сайт: {link}
Теги (контекст): {tags}
Главный тег доски: {board_name}

Сделай строго в 3 этапа:
1) 100 ЗАГОЛОВКОВ (3-8 слов, без эмодзи, без точек в конце, в стиле Pinterest)
2) 100 ОПИСАНИЙ (с эмодзи в начале, без "A" в начале, включи слово FREE или DISCOUNT, 1-2 предложения)
3) 100 CTA (короткие призывы перейти на сайт с эмодзи)

ВАЖНО: Каждый список должен быть отдельным. Не нумеруй строки."""


def process_strategy(strategy_path: str, strategy_name: str, base_dir: str):
    # Поиск XLSX
    xlsx_file = next((os.path.join(strategy_path, f) for f in os.listdir(strategy_path)
                      if f.endswith(".xlsx") and not f.startswith("~$")), None)

    if not xlsx_file:
        print(f"⚠️ XLSX не найден в {strategy_name}")
        return

    for_main = os.path.join(strategy_path, "For Main")
    # Ищем linksite.txt сначала в корне скрипта, потом в For Main
    link = read_txt(os.path.join(base_dir, "linksite.txt"))
    tags = read_txt(os.path.join(for_main, "Boards_Tags.txt"))
    board = read_txt(os.path.join(for_main, "Boards_Name.txt"))

    if not all([link, tags, board]):
        print(f"⚠️ Ошибка: Проверь файлы linksite.txt, Boards_Tags.txt, Boards_Name.txt")
        return

    # Вывод промпта
    print("\n" + "═" * 80)
    print(f"🚀 СТРАТЕГИЯ: {strategy_name}")
    print("═" * 80)
    print(build_prompt(link, tags, board))
    print("═" * 80)
    print("👆 Скопируйте промпт выше и отправьте в AI.")

    # Пошаговый ввод
    titles = get_clean_list("100 ЗАГОЛОВКОВ")
    if not titles: return

    descs = get_clean_list("100 ОПИСАНИЙ")
    if not descs: return

    ctas = get_clean_list("100 ПРИЗЫВОВ (CTA)")
    if not ctas: return

    fill_xlsx(xlsx_file, titles, descs, ctas)


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"🌟 Запуск пошагового наполнителя")

    # Ищем папки ниш
    niches = sorted([d for d in os.listdir(base_dir)
                     if os.path.isdir(os.path.join(base_dir, d)) and not d.startswith('.')])

    for niche in niches:
        niche_path = os.path.join(base_dir, niche)
        print(f"\n💎 НИША: {niche}")

        # Ищем папки стратегий
        strategies = sorted([d for d in os.listdir(niche_path)
                             if os.path.isdir(os.path.join(niche_path, d)) and re.match(r'^\d+', d)])

        for strat in strategies:
            process_strategy(os.path.join(niche_path, strat), strat, base_dir)

            cont = input("\nПерейти к следующей стратегии? (Enter - Да, n - Выход): ")
            if cont.lower() == 'n':
                return

    print("\n🎉 Все задачи выполнены!")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nРабота прервана пользователем.")