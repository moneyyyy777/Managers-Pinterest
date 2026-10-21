import os
import shutil
import re
import csv


def clean_name(text):
    name = os.path.splitext(text)[0]
    name = name.replace('&', 'n')
    name = re.sub(r'[^a-zA-Z0-9\s]', '', name)
    name = ' '.join(name.split())
    return name


def extract_tags(file_path):
    tags = []
    ext = os.path.splitext(file_path)[1].lower()

    if ext == '.csv':
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                match = re.match(r'^([^;]+);\s*\d+', line)
                if match:
                    tag = match.group(1).strip()
                    if tag.lower() in ['keyword', 'tags', 'tag', 'search queries', 'тег', 'запросы']:
                        continue
                    tags.append(tag)

    elif ext == '.txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    tags.append(line)

    return tags


def write_boards_name(folder_path, tags):
    if not tags:
        return
    boards_name_path = os.path.join(folder_path, 'For Main', 'Boards_Name.txt')
    if not os.path.exists(os.path.dirname(boards_name_path)):
        print(f"  ⚠️  Папка 'For Main' не найдена в {folder_path}")
        return
    first_tag = tags[0].strip().title()
    with open(boards_name_path, 'w', encoding='utf-8') as f:
        f.write(first_tag)
    print(f"  ✅ Boards_Name.txt: {first_tag}")


def write_boards_tags(folder_path, tags):
    if not tags:
        return
    boards_tags_path = os.path.join(folder_path, 'For Main', 'Boards_Tags.txt')
    if not os.path.exists(os.path.dirname(boards_tags_path)):
        print(f"  ⚠️  Папка 'For Main' не найдена в {folder_path}")
        return
    content = '\n'.join(tag for tag in tags if tag.strip())
    content = content.rstrip('\n') + '\n'
    with open(boards_tags_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✅ Boards_Tags.txt ({len(tags)} тегов)")


def get_available_templates(source_base_path):
    """
    Сканирует source_base_path и собирает шаблоны.
    Папка попадает в список если:
      - внутри неё есть подпапка Template (обычный случай)
      - внутри неё НЕТ Template, но есть вложенные папки с Template (папка-контейнер)
    Возвращает список кортежей: (display_name, template_path_or_None, sub_templates_or_None)
      - Обычный:    (name, template_path, None)
      - Контейнер:  (name, None, [(sub_name, sub_template_path), ...])
    """
    result = []

    for folder in sorted(os.listdir(source_base_path)):
        full_path = os.path.join(source_base_path, folder)
        if not os.path.isdir(full_path) or folder.startswith('.'):
            continue

        template_path = os.path.join(full_path, 'Template')

        if os.path.isdir(template_path):
            # Обычный случай — Template прямо здесь
            result.append((folder, template_path, None))
        else:
            # Проверяем вложенные папки на наличие Template
            sub_templates = []
            for sub in sorted(os.listdir(full_path)):
                sub_path = os.path.join(full_path, sub)
                sub_template = os.path.join(sub_path, 'Template')
                if os.path.isdir(sub_path) and os.path.isdir(sub_template) and not sub.startswith('.'):
                    sub_templates.append((sub, sub_template))

            if sub_templates:
                # Папка-контейнер — Template лежат на уровень глубже
                result.append((folder, None, sub_templates))

    return result


def choose_template(available_templates):
    """
    Интерактивный выбор шаблона с поддержкой папок-контейнеров.
    Возвращает путь к Template или None если пользователь пропустил.
    """
    print("\nДоступные шаблоны:")
    for i, (name, template_path, sub_templates) in enumerate(available_templates, 1):
        marker = "📁" if sub_templates else "  "
        print(f"  {i}. {marker} {name}")

    choice_input = input("\nВыберите номер шаблона (или Enter чтобы пропустить нишу): ").strip()
    if not choice_input:
        return None

    try:
        choice_idx = int(choice_input) - 1
        name, template_path, sub_templates = available_templates[choice_idx]
    except (ValueError, IndexError):
        print("Ошибка выбора. Ниша пропущена.")
        return None

    # Обычный случай
    if template_path is not None:
        return template_path

    # Папка-контейнер — переходим на уровень ниже
    print(f"\n  📁 '{name}' содержит вложенные шаблоны:")
    for i, (sub_name, _) in enumerate(sub_templates, 1):
        print(f"    {i}. {sub_name}")

    sub_choice = input("\n  Выберите номер вложенного шаблона (или Enter чтобы пропустить): ").strip()
    if not sub_choice:
        return None

    try:
        sub_idx = int(sub_choice) - 1
        _, sub_template_path = sub_templates[sub_idx]
        return sub_template_path
    except (ValueError, IndexError):
        print("Ошибка выбора. Ниша пропущена.")
        return None


def process_niche(product_path, niche_name, niche_path, source_base_path, available_templates):
    print(f"\n{'=' * 50}")
    print(f"=== Ниша: {niche_name} ===")

    selected_template_path = choose_template(available_templates)
    if selected_template_path is None:
        return

    choice_all = input("Делать для All? y/n ").strip().lower()

    csv_names = []
    txt_names = []

    for f in os.listdir(niche_path):
        if f.endswith('.csv'):
            if '(Filter by OpenAI)' in f or '(Dima)' in f:
                csv_names.append(f)
            if '(All)' in f and choice_all == 'y':
                csv_names.append(f)
        if f.endswith('.txt'):
            if '(Itent' in f:
                txt_names.append(f)

    csv_names.sort()
    txt_names.sort()
    all_source_files = csv_names + txt_names

    if not all_source_files:
        print(f"  Подходящих файлов не найдено в нише [{niche_name}]. Пропускаем.")
        return

    print(f"\nСоздаю {len(all_source_files)} папок в нише [{niche_name}]...")

    for index, original_file in enumerate(all_source_files, 1):
        cleaned = clean_name(original_file)
        new_folder_name = f"{index} {cleaned}"
        target_path = os.path.join(niche_path, new_folder_name)
        source_file_path = os.path.join(niche_path, original_file)

        try:
            if not os.path.exists(target_path):
                tags = extract_tags(source_file_path)

                if not tags:
                    print(f"  ⚠️  Теги не найдены в: {original_file} (пропускаем создание папки)")
                    continue

                shutil.copytree(selected_template_path, target_path)

                for item in os.listdir(target_path):
                    if item.endswith('.xlsx'):
                        old_xlsx_path = os.path.join(target_path, item)
                        new_xlsx_name = f"{new_folder_name}.xlsx"
                        new_xlsx_path = os.path.join(target_path, new_xlsx_name)
                        os.rename(old_xlsx_path, new_xlsx_path)
                        print(f"  Создано: {new_folder_name} (Excel переименован)")
                        break

                write_boards_tags(target_path, tags)
                write_boards_name(target_path, tags)

            else:
                print(f"  Пропущено (уже существует): {new_folder_name}")

        except Exception as e:
            print(f"  Ошибка при обработке {new_folder_name}: {e}")


def create_folders_from_template():
    product_path = os.path.dirname(os.path.abspath(__file__))
    product_name = os.path.basename(product_path)

    print(f"--- third_copier_folders | Продукт: {product_name} ---")

    source_base_path = '/Managers Pinterest/All Folders/Niches'

    if not os.path.exists(source_base_path):
        print(f"Ошибка: Путь к шаблонам не найден:\n  {source_base_path}")
        input("Нажмите Enter, чтобы выйти...")
        return

    available_templates = get_available_templates(source_base_path)

    if not available_templates:
        print("Папки с подпапкой 'Template' не найдены.")
        input("Нажмите Enter, чтобы выйти...")
        return

    niche_folders = []
    for item in sorted(os.listdir(product_path)):
        full_path = os.path.join(product_path, item)
        if os.path.isdir(full_path) and not item.startswith('.') and item != 'Template':
            niche_folders.append((item, full_path))

    if not niche_folders:
        print("Нишевые подпапки не найдены.")
        input("Нажмите Enter, чтобы выйти...")
        return

    print(f"\nНайдено ниш: {len(niche_folders)}")
    for name, _ in niche_folders:
        print(f"  • {name}")

    for niche_name, niche_path in niche_folders:
        process_niche(product_path, niche_name, niche_path, source_base_path, available_templates)

    print(f"\n{'=' * 50}")
    print("Все операции завершены!")


if __name__ == "__main__":
    create_folders_from_template()
    input("\nНажмите Enter, чтобы выйти...")