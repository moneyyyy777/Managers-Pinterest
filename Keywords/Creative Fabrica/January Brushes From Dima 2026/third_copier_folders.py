import os
import shutil
import re

def clean_name(text):
    """Очистка имени для папки: убираем расширение, меняем & на n, удаляем спецсимволы."""
    name = os.path.splitext(text)[0]
    name = name.replace('&', 'n')
    # Оставляем буквы (в т.ч. кириллицу), цифры и пробелы
    name = re.sub(r'[^a-zA-Zа-яА-Я0-9\s]', '', name)
    name = ' '.join(name.split())
    return name


def process_csv_content(file_path):
    """
    Обработка CSV:
    1. Ищет строки, где есть ';' и цифра после неё.
    2. Берет только текст ДО ';'.
    """
    processed_tags = []
    try:
        # Используем utf-8-sig для файлов из Excel
        with open(file_path, 'r', encoding='utf-8-sig', errors='ignore') as f:
            for line in f:
                line = line.strip()
                if ';' in line:
                    parts = line.split(';')
                    # Проверяем, есть ли во второй части (после ;) цифры
                    if len(parts) > 1 and any(char.isdigit() for char in parts[1]):
                        tag = parts[0].strip()
                        if tag:
                            processed_tags.append(tag)
    except Exception as e:
        print(f"Ошибка при чтении CSV {file_path}: {e}")

    return "\n".join(processed_tags)


def create_folders_from_template():
    source_base_path = '/Managers Pinterest/All Folders/Creative Fabrica'
    current_dir = os.getcwd()

    if not os.path.exists(source_base_path):
        print(f"Ошибка: Путь {source_base_path} не найден.")
        return

    available_templates = []
    for folder in os.listdir(source_base_path):
        full_path = os.path.join(source_base_path, folder)
        template_path = os.path.join(full_path, 'Template')
        if os.path.isdir(full_path) and os.path.isdir(template_path):
            available_templates.append((folder, template_path))

    if not available_templates:
        print("В указанном пути не найдено папок с подпапкой 'Template'.")
        return

    print("\nНайдены доступные шаблоны:")
    for i, (name, _) in enumerate(available_templates, 1):
        print(f"{i}. {name}")

    try:
        choice_idx = int(input("\nВыберите номер шаблона: ")) - 1
        selected_template_path = available_templates[choice_idx][1]
    except (ValueError, IndexError):
        print("Ошибка выбора.")
        return

    # Собираем файлы для обработки
    csv_names = []
    txt_names = []
    for f in os.listdir(current_dir):
        if f.endswith('.csv') and ('(Filter by OpenAI)' in f or '(Dima)' in f):
            csv_names.append(f)
        if f.endswith('.txt') and '(Itent:' in f:
            txt_names.append(f)

    csv_names.sort()
    txt_names.sort()
    all_source_files = csv_names + txt_names

    if not all_source_files:
        print("Нет файлов для создания папок (проверьте, что CSV/TXT файлы в этой же папке).")
        return

    print(f"\nНачинаю создание {len(all_source_files)} папок...")

    for index, original_file in enumerate(all_source_files, 1):
        cleaned_name = clean_name(original_file)
        new_folder_name = f"{index} {cleaned_name}"
        target_path = os.path.join(current_dir, new_folder_name)

        try:
            if not os.path.exists(target_path):
                # Шаг 1: Копируем шаблон
                shutil.copytree(selected_template_path, target_path)

                # Шаг 2: Переименовываем XLSX внутри
                for item in os.listdir(target_path):
                    if item.endswith('.xlsx'):
                        os.rename(
                            os.path.join(target_path, item),
                            os.path.join(target_path, f"{new_folder_name}.xlsx")
                        )

                # Шаг 3: Наполняем Boards_Tags.txt
                tags_file_path = os.path.join(target_path, 'For Main', 'Boards_Tags.txt')
                os.makedirs(os.path.dirname(tags_file_path), exist_ok=True)

                content = ""
                if original_file.endswith('.txt'):
                    with open(original_file, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read().strip() # Убираем лишние пробелы по краям
                elif original_file.endswith('.csv'):
                    content = process_csv_content(original_file)

                # Записываем результат и добавляем пустую строку в конце
                with open(tags_file_path, 'w', encoding='utf-8') as f:
                    f.write(content + '\n')

                print(f"--- Готово: {new_folder_name}")
                if content:
                    first_line = content.split('\n')[0]
                    print(f"    Теги добавлены (всего {len(content.splitlines())} шт). Первая строка: {first_line}")
                else:
                    print(f"    ПРЕДУПРЕЖДЕНИЕ: Файл {original_file} был пуст или не прошел фильтрацию.")
            else:
                print(f"--- Пропущено (уже есть): {new_folder_name}")

        except Exception as e:
            print(f"Ошибка при обработке {new_folder_name}: {e}")

    print("\nВсе операции завершены!")


if __name__ == "__main__":
    create_folders_from_template()
    input("\nНажмите Enter, чтобы выйти...")