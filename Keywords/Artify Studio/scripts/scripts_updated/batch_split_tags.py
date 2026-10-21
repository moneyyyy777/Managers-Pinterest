import os


def split_keywords():
    # Настройки
    input_filename = 'Pininspector + Seeds.txt'
    batch_folder = 'Batch for SearchVolume'
    done_folder = os.path.join(batch_folder, 'Done')
    lines_per_file = 600

    # 1. Проверяем наличие исходного файла
    if not os.path.exists(input_filename):
        print(f"Ошибка: Файл '{input_filename}' не найден в текущей папке.")
        return

    # 2. Создаем папки, если их нет
    if not os.path.exists(done_folder):
        os.makedirs(done_folder)
        print(f"Созданы папки: {batch_folder} и {done_folder}")

    # 3. Читаем все строки из файла
    with open(input_filename, 'r', encoding='utf-8') as f:
        # Убираем пустые строки и лишние пробелы
        lines = [line.strip() for line in f if line.strip()]

    total_lines = len(lines)
    print(f"Всего строк в файле: {total_lines}")

    # 4. Режем на куски и сохраняем
    count = 0
    for i in range(0, total_lines, lines_per_file):
        count += 1
        chunk = lines[i: i + lines_per_file]

        output_filename = f"{count}.txt"
        output_path = os.path.join(batch_folder, output_filename)

        with open(output_path, 'w', encoding='utf-8') as out_f:
            out_f.write('\n'.join(chunk))

        print(f"Файл {output_filename} создан (строк: {len(chunk)})")

    print("\nГотово! Все файлы лежат в папке 'Batch for SearchVolume'.")
    print("Папка 'Done' готова для перемещения туда отработанных файлов.")


if __name__ == "__main__":
    split_keywords()