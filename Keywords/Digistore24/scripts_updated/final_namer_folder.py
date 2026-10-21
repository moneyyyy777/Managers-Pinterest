import os
import re
import shutil
from datetime import datetime


def ask_platform():
    print("\n  Выберите платформу:")
    print("    1 - Google (GL)")
    platform_input = input("  Введите 1 (Enter = Google): ").strip()
    platform = "GL"
    print(f"  Платформа: {platform}")
    return platform


def ask_site_type():
    print("\n  Тип сайта:")
    print("    1 - Single Direct (SD) — один товар, прямая партнёрская ссылка")
    print("    2 - Showcase (SH)      — витрина нескольких товаров")
    site_input = input("  Введите 1 или 2 (Enter = SD): ").strip()
    site_type = "SH" if site_input == "2" else "SD"
    print(f"  Тип сайта: {site_type}")
    return site_type


def ask_suffix():
    print("\n  Выберите дополнение к названию:")
    print("    1 - With Links (WL)")
    print("    2 - Link Up (LU)")
    print("    3 - Оба сразу (WL + LU копия)")
    suffix_input = input("  Введите 1, 2 или 3 (Enter = WL): ").strip()
    if suffix_input == "2":
        return ["LU"]
    elif suffix_input == "3":
        return ["WL", "LU"]
    else:
        return ["WL"]


def read_existing_paths(filepath):
    """Читает существующие пути из файла, возвращает set."""
    if not os.path.exists(filepath):
        return set()
    with open(filepath, "r", encoding="utf-8") as f:
        return set(line.strip() for line in f if line.strip())


def write_paths_file(filepath, new_paths):
    """
    Дописывает новые пути в файл без дублей.
    Старые пути сохраняются, новые добавляются в конец.
    """
    existing = read_existing_paths(filepath)
    to_add = [p for p in new_paths if p not in existing]
    if not to_add:
        return 0
    with open(filepath, "a", encoding="utf-8") as f:
        # Если файл уже есть и не пустой — добавляем с новой строки
        if existing:
            f.write("\n")
        f.write("\n".join(to_add))
    return len(to_add)


def process_folder(niche_path, niche_folder, folder_name, platform, site_type, suffix,
                   update_links, last_link, path_prefix, today_date, new_folder_paths_list,
                   product_folder_name):
    clean_name = re.sub(r'\s+\S.*\s+\d{6}$', '', folder_name)
    print(f"\n  >>> Обработка: {clean_name}")

    old_folder_path = os.path.join(niche_path, folder_name)

    # Запрашиваем ссылку
    current_link = last_link
    if update_links:
        prompt = "     Введите ссылку"
        if last_link:
            prompt += f" (Enter для {last_link})"
        entered = input(f"{prompt}: ").strip()
        if entered:
            current_link = entered

        link_file_dir = os.path.join(old_folder_path, "For Main")
        link_file_path = os.path.join(link_file_dir, "Link_Site.txt")
        try:
            os.makedirs(link_file_dir, exist_ok=True)
            with open(link_file_path, "w", encoding="utf-8") as f:
                f.write(current_link)
            print(f"     [OK] Ссылка записана")
        except Exception as e:
            print(f"     [!] Ошибка записи ссылки: {e}")

    # Формат: [Название] GL SD WL 240625
    platform_block = f"{platform} {site_type} {suffix}"
    new_folder_name = f"{clean_name} {platform_block} {today_date}"
    new_folder_path = os.path.join(niche_path, new_folder_name)

    try:
        if os.path.exists(old_folder_path):
            os.rename(old_folder_path, new_folder_path)

        full_generated_path = f"{path_prefix}{product_folder_name}\\{niche_folder}\\{new_folder_name}"
        new_folder_paths_list.append(full_generated_path)
        print(f"     [OK] Папка: -> {new_folder_name}")

        for file in os.listdir(new_folder_path):
            if file.endswith(".xlsx"):
                old_file_path = os.path.join(new_folder_path, file)
                new_file_name = f"{new_folder_name}.xlsx"
                new_file_path = os.path.join(new_folder_path, new_file_name)
                if old_file_path != new_file_path:
                    os.rename(old_file_path, new_file_path)
                    print(f"     [OK] Excel переименован")
                break
    except Exception as e:
        print(f"     [!] Ошибка: {e}")

    return current_link


def mass_rename_folders():
    # Скрипт лежит рядом с продуктовыми папками (ALL FOLDERS May/)
    # script_dir — папка где лежит скрипт = ALL FOLDERS May/
    script_dir = os.path.dirname(os.path.abspath(__file__))

    today_date = datetime.now().strftime("%d%m%y")
    path_prefix = r"..\Pinterest\Accounts Pinterest\\"

    # Файлы путей создаются рядом со скриптом
    auto_path_file   = os.path.join(script_dir, "automation_folder_path1.txt")
    folder_path1_file = os.path.join(script_dir, "folder_path1.txt")
    folder_path2_file = os.path.join(script_dir, "folder_path2.txt")

    print(f"--- Массовое обновление папок ---")
    print(f"    Рабочая папка: {script_dir}")

    update_links_input = input(
        "Обновлять ссылки в файлах Link_Site.txt? (Enter - Да, n - Нет): ").strip().lower()
    update_links = update_links_input not in ['n', 'нет', 'no']

    # Продуктовые папки — это подпапки рядом со скриптом
    # Исключаем папки, которые начинаются с точки или служебные
    product_folders = sorted([
        d for d in os.listdir(script_dir)
        if os.path.isdir(os.path.join(script_dir, d)) and not d.startswith('.')
    ])

    if not product_folders:
        print("Продуктовые папки не найдены.")
        return

    new_folder_paths_list = []
    last_link = ""

    for product_folder_name in product_folders:
        product_path = os.path.join(script_dir, product_folder_name)

        # Внутри продуктовой папки ищем нишевые подпапки
        niche_folders = sorted([
            d for d in os.listdir(product_path)
            if os.path.isdir(os.path.join(product_path, d)) and not d.startswith('.')
        ])

        if not niche_folders:
            continue

        print(f"\n{'#' * 50}")
        print(f"### Продукт: {product_folder_name} ###")

        for niche_folder in niche_folders:
            niche_path = os.path.join(product_path, niche_folder)

            folders_to_process = [
                d for d in os.listdir(niche_path)
                if os.path.isdir(os.path.join(niche_path, d)) and re.match(r'^\d+', d)
            ]

            if not folders_to_process:
                continue

            folders_to_process.sort(key=lambda x: int(re.match(r'^\d+', x).group()))

            print(f"\n{'=' * 50}")
            print(f"=== Ниша: {niche_folder} (Папок: {len(folders_to_process)}) ===")

            platform  = ask_platform()
            site_type = ask_site_type()
            suffixes  = ask_suffix()

            print(f"\n  Итог: {platform} {site_type} {' + '.join(suffixes)} {today_date}")
            print(f"{'=' * 50}")

            for folder_name in folders_to_process:
                original_folder_path = os.path.join(niche_path, folder_name)

                if len(suffixes) == 1:
                    last_link = process_folder(
                        niche_path, niche_folder, folder_name, platform, site_type, suffixes[0],
                        update_links, last_link, path_prefix, today_date, new_folder_paths_list,
                        product_folder_name
                    )
                else:
                    # Двойной режим — WL переименование, LU копия
                    clean_name = re.sub(r'\s+\S.*\s+\d{6}$', '', folder_name)
                    print(f"\n  >>> Обработка: {clean_name}")

                    current_link = last_link
                    if update_links:
                        prompt = "     Введите ссылку"
                        if last_link:
                            prompt += f" (Enter для {last_link})"
                        entered = input(f"{prompt}: ").strip()
                        if entered:
                            current_link = entered
                        last_link = current_link

                        link_file_dir = os.path.join(original_folder_path, "For Main")
                        link_file_path = os.path.join(link_file_dir, "Link_Site.txt")
                        try:
                            os.makedirs(link_file_dir, exist_ok=True)
                            with open(link_file_path, "w", encoding="utf-8") as f:
                                f.write(current_link)
                            print(f"     [OK] Ссылка записана")
                        except Exception as e:
                            print(f"     [!] Ошибка записи ссылки: {e}")

                    # WL — переименование оригинала
                    first_suffix = suffixes[0]
                    first_name = f"{clean_name} {platform} {site_type} {first_suffix} {today_date}"
                    first_path = os.path.join(niche_path, first_name)
                    try:
                        os.rename(original_folder_path, first_path)
                        new_folder_paths_list.append(
                            f"{path_prefix}{product_folder_name}\\{niche_folder}\\{first_name}"
                        )
                        print(f"     [OK] Папка WL: -> {first_name}")
                        for file in os.listdir(first_path):
                            if file.endswith(".xlsx"):
                                os.rename(os.path.join(first_path, file),
                                          os.path.join(first_path, f"{first_name}.xlsx"))
                                print(f"     [OK] Excel WL переименован")
                                break
                    except Exception as e:
                        print(f"     [!] Ошибка WL: {e}")

                    # LU — копия
                    second_suffix = suffixes[1]
                    second_name = f"{clean_name} {platform} {site_type} {second_suffix} {today_date}"
                    second_path = os.path.join(niche_path, second_name)
                    try:
                        shutil.copytree(first_path, second_path)
                        new_folder_paths_list.append(
                            f"{path_prefix}{product_folder_name}\\{niche_folder}\\{second_name}"
                        )
                        print(f"     [OK] Папка LU (копия): -> {second_name}")
                        for file in os.listdir(second_path):
                            if file.endswith(".xlsx"):
                                os.rename(os.path.join(second_path, file),
                                          os.path.join(second_path, f"{second_name}.xlsx"))
                                print(f"     [OK] Excel LU переименован")
                                break
                    except Exception as e:
                        print(f"     [!] Ошибка LU копии: {e}")

    # Запись файлов путей рядом со скриптом — с добавлением, без дублей
    if new_folder_paths_list:
        print("\n" + "=" * 50)
        print("Генерация файлов путей...")

        added_auto = write_paths_file(auto_path_file, new_folder_paths_list)
        print(f"  automation_folder_path1.txt — добавлено путей: {added_auto}")

        path_list_1 = [p for i, p in enumerate(new_folder_paths_list) if i % 2 == 0]
        path_list_2 = [p for i, p in enumerate(new_folder_paths_list) if i % 2 == 1]

        added_1 = write_paths_file(folder_path1_file, path_list_1)
        added_2 = write_paths_file(folder_path2_file, path_list_2)
        print(f"  folder_path1.txt            — добавлено путей: {added_1}")
        print(f"  folder_path2.txt            — добавлено путей: {added_2}")

        print(f"\n  Файлы путей: {script_dir}")

    print("=" * 50)
    print("Все задачи выполнены!")


if __name__ == "__main__":
    mass_rename_folders()
    input("\nНажмите Enter, чтобы выйти...")