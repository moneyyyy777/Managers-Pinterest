import pandas as pd
import glob
import re
import os
import chardet

folder = os.path.dirname(os.path.abspath(__file__))

pattern = os.path.join(folder, "export*.csv")
files = glob.glob(pattern)

def sort_key(path):
    name = os.path.basename(path)
    match = re.search(r'\((\d+)\)', name)
    return int(match.group(1)) if match else -1

files.sort(key=sort_key)

if not files:
    print("Файлы export*.csv не найдены в папке:", folder)
    exit()

print(f"Найдено файлов: {len(files)}")

dfs = []
for f in files:
    with open(f, "rb") as raw:
        encoding = chardet.detect(raw.read())["encoding"] or "utf-8"
    print(f"  Загружен: {os.path.basename(f)} (кодировка: {encoding})")

    rows = []
    with open(f, encoding=encoding, errors="replace") as fh:
        lines = fh.readlines()
    for line in lines[2:]:
        line = line.strip()
        if not line:
            continue
        parts = line.split(";")
        tag = parts[0].strip() if len(parts) > 0 else ""
        views = parts[1].strip() if len(parts) > 1 else ""
        rows.append([tag, views])

    df = pd.DataFrame(rows)
    dfs.append(df)
    print(f"    → {len(df)} строк")

combined = pd.concat(dfs, ignore_index=True)

combined[1] = pd.to_numeric(combined[1], errors="coerce")

# === НОВЫЙ БЛОК: Запрос пользователю и фильтрация ===
choice = input("Убирать теги с 0 показателем? (y - да / n - нет): ").strip().lower()
if choice in ['y', 'yes', 'д', 'да']:
    # Оставляем только те строки, где значение строго больше 0
    # Это также автоматически удалит пустые значения (NaN)
    combined = combined[combined[1] > 0]
    print("Строки с нулевыми и пустыми показателями удалены.")
# ====================================================

combined.sort_values(by=1, ascending=False, inplace=True)
combined.reset_index(drop=True, inplace=True)

# Имя файла = название папки + (All)
folder_name = os.path.basename(folder)
output_path = os.path.join(folder, f"{folder_name} (All).csv")

combined.to_csv(output_path, index=False, header=False, sep=";", encoding="utf-8-sig")

print(f"\nГотово! Файл сохранён: {output_path}")
print(f"Всего строк в итоговом файле: {len(combined)}")