import os
import shutil
import re
import csv


def clean_name(text):
    # Убираем расширение
    name = os.path.splitext(text)[0]
    # Заменяем & на n
    name = name.replace('&', 'n')
    # Оставляем только буквы, цифры и пробелы
    name = re.sub(r'[^a-zA-Z0-9\s]', '', name)
    # Убираем лишние пробелы
    name = ' '.join(name.split())
    return name


def extract_tags(file_path):
    """Извлекает теги из CSV или TXT файла."""
    tags = []
    ext = os.path.splitext(file_path)[1].lower()

    if ext == '.csv':
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                # Берём только первый столбец (до первого ;)
                first_col = line.split(';')[0].strip()
                if first_col:
                    tags.append(first_col)

    elif ext == '.txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    tags.append(line)

    return tags


def write_boards_name(folder_path, tags):
    """Записывает первый тег в Title Case в For Main/Boards_Name.txt."""
    boards_name_path = os.path.join(folder_path, 'For Main', 'Boards_Name.txt')

    if not os.path.exists(os.path.dirname(boards_name_path)):
        print(f"  ⚠️  Папка 'For Main' не найдена в {folder_path}")
        return

    first_tag = tags[0].strip().title()

    with open(boards_name_path, 'w', encoding='utf-8') as f:
        f.write(first_tag)

    print(f"  ✅ Boards_Name.txt заполнен: {first_tag}")


def write_boards_tags(folder_path, tags):
    """Записывает теги в For Main/Boards_Tags.txt с пустой строкой в конце."""
    boards_tags_path = os.path.join(folder_path, 'For Main', 'Boards_Tags.txt')

    if not os.path.exists(os.path.dirname(boards_tags_path)):
        print(f"  ⚠️  Папка 'For Main' не найдена в {folder_path}")
        return

    # Убираем пустые строки в конце списка тегов, затем добавляем ровно одну
    content = '\n'.join(tag for tag in tags if tag.strip())
    content = content.rstrip('\n') + '\n\n'

    with open(boards_tags_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  ✅ Boards_Tags.txt заполнен ({len(tags)} тегов)")


def create_folders_from_template():
    # --- НАСТРОЙКИ ---
    source_base_path = '/Managers Pinterest/All Folders/Creative Fabrica'
    current_dir = os.getcwd()

    # 1. Поиск папок с Template
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

    # 2. Выбор шаблона пользователем
    print("\nНайдены доступные шаблоны:")
    for i, (name, _) in enumerate(available_templates, 1):
        print(f"{i}. {name}")

    try:
        choice_idx = int(input("\nВыберите номер шаблона для копирования: ")) - 1
        selected_template_path = available_templates[choice_idx][1]
    except (ValueError, IndexError):
        print("Ошибка выбора. Завершение.")
        return

    choice_all = input("\nНужно ли делать для All? y/n ")

    # 3. Сканирование текущей папки для поиска имен
    csv_names = []
    txt_names = []

    for f in os.listdir(current_dir):
        if f.endswith('.csv'):
            if '(Filter by OpenAI)' in f or '(Dima)' in f:
                csv_names.append(f)
            if '(All)' in f and choice_all == "y":
                csv_names.append(f)
        if f.endswith('.txt'):
            if '(Itent' in f:
                txt_names.append(f)

    csv_names.sort()
    txt_names.sort()
    all_source_files = csv_names + txt_names

    if not all_source_files:
        print("В текущей папке не найдено подходящих файлов для именования.")
        return

    # 4. Создание папок
    print(f"\nНачинаю создание {len(all_source_files)} папок...")

    for index, original_file in enumerate(all_source_files, 1):
        cleaned_name = clean_name(original_file)
        new_folder_name = f"{index} {cleaned_name}"
        target_path = os.path.join(current_dir, new_folder_name)
        source_file_path = os.path.join(current_dir, original_file)

        try:
            if not os.path.exists(target_path):
                # Копируем папку Template целиком
                shutil.copytree(selected_template_path, target_path)

                # Переименование .xlsx внутри новой папки
                for item in os.listdir(target_path):
                    if item.endswith('.xlsx'):
                        old_xlsx_path = os.path.join(target_path, item)
                        new_xlsx_name = f"{new_folder_name}.xlsx"
                        new_xlsx_path = os.path.join(target_path, new_xlsx_name)
                        os.rename(old_xlsx_path, new_xlsx_path)
                        print(f"Создано: {new_folder_name} (Excel переименован)")
                        break

                # Извлекаем теги и записываем в Boards_Tags.txt и Boards_Name.txt
                tags = extract_tags(source_file_path)
                if tags:
                    write_boards_tags(target_path, tags)
                    write_boards_name(target_path, tags)
                else:
                    print(f"  ⚠️  Теги не найдены в файле: {original_file}")

            else:
                print(f"Пропущено (уже существует): {new_folder_name}")

        except Exception as e:
            print(f"Ошибка при обработке {new_folder_name}: {e}")

    print("\nВсе операции завершены!")


if __name__ == "__main__":
    create_folders_from_template()
    input("\nНажмите Enter, чтобы выйти...")