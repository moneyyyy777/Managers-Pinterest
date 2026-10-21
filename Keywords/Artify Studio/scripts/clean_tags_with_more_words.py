import os

TARGET_FILES = {"Pininspector.txt", "Pininspector + Seeds.txt"}
OUTPUT_FILE = "More 4 Words Tags.txt"


def process_folders(start_path):
    for root, dirs, files in os.walk(start_path):
        present_targets = [f for f in files if f in TARGET_FILES]

        if not present_targets:
            continue

        print(f"\n📂 Обработка папки: {root}")

        long_tags = {}
        output_filepath = os.path.join(root, OUTPUT_FILE)

        # Считываем существующие теги (если файл уже был)
        if os.path.exists(output_filepath):
            try:
                with open(
                    output_filepath, "r", encoding="utf-8", errors="ignore"
                ) as f:
                    for line in f:
                        clean_line = line.strip()
                        if clean_line:
                            long_tags[clean_line] = None
            except Exception as e:
                print(f"  ⚠️ Ошибка чтения {output_filepath}: {e}")

        # Обрабатываем файлы в текущей подпапке
        for filename in present_targets:
            file_path = os.path.join(root, filename)
            kept_lines = []
            file_changed = False

            try:
                with open(
                    file_path, "r", encoding="utf-8", errors="ignore"
                ) as f:
                    lines = f.readlines()

                for line in lines:
                    clean_line = line.strip()
                    if not clean_line:
                        continue

                    words = clean_line.split()
                    if len(words) > 4:
                        long_tags[clean_line] = None
                        file_changed = True
                    else:
                        kept_lines.append(clean_line)

                # Перезаписываем очищенный файл
                if file_changed:
                    with open(file_path, "w", encoding="utf-8") as f:
                        for tag in kept_lines:
                            f.write(tag + "\n")
                    print(f"  ✂️  Из файла '{filename}' удалены длинные теги.")

            except Exception as e:
                print(f"  ❌ Ошибка при обработке {file_path}: {e}")

        # Сохраняем результат
        if long_tags:
            try:
                with open(output_filepath, "w", encoding="utf-8") as f:
                    for tag in long_tags.keys():
                        f.write(tag + "\n")
                print(
                    f"  ✅ Сохранен '{OUTPUT_FILE}' (уникальных тегов: {len(long_tags)})"
                )
            except Exception as e:
                print(f"  ❌ Ошибка записи {output_filepath}: {e}")


if __name__ == "__main__":
    # ЭТА СТРОКА берет именно папку Test, где лежит сам скрипт:
    SCRIPT_FOLDER = os.path.dirname(os.path.abspath(__file__))

    print(f"🚀 Старт! Сканируем строго папку со скриптом и все что ВНУТРИ нее:")
    print(f"📍 Путь: {SCRIPT_FOLDER}\n")

    process_folders(SCRIPT_FOLDER)

    print("\n🎉 Готово!")