import os
import re
from datetime import datetime


def ask_platform():
    print("\n  Выберите платформу:")
    print("    1 - Netify (Netify)")
    print("    2 - Gooogle (Gole)")
    platform_input = input("Введите 1 или 2 (Enter = Netify): ").strip()
    platform = "" if platform_input == "2" else "Netify"
    print(f"Платформа: {platform}")
    return platform


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


def process_folder(category_path, category_folder, folder_name, platform, suffix,
                   update_links, last_link, path_prefix, today_date, new_folder_paths_list):
    clean_name = re.sub(r'\s+\S.*\s+\d{6}$', '', folder_name)
    print(f"\n  >>> Обработка: {clean_name}")

    old_folder_path = os.path.join(category_path, folder_name)

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

    platform_block = f"{platform} {suffix}"
    new_folder_name = f"{clean_name} {platform_block} {today_date}"
    new_folder_path = os.path.join(category_path, new_folder_name)

    # Если двойной режим — первый суффикс переименовывает, второй копирует
    is_copy = os.path.exists(new_folder_path) or not os.path.exists(old_folder_path)

    try:
        if os.path.exists(old_folder_path):
            os.rename(old_folder_path, new_folder_path)
        # else — уже переименована первым суффиксом, делаем копию
        elif os.path.exists(new_folder_path):
            pass

        full_generated_path = f"{path_prefix}{category_folder}\\{new_folder_name}"
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
    current_dir = os.getcwd()
    today_date = datetime.now().strftime("%d%m%y")
    path_prefix = r"..\Pinterest\Accounts Pinterest\\"

    print("--- Массовое обновление папок (Вложенный режим) ---")

    # Обновлять ссылки? — спрашиваем один раз глобально
    update_links_input = input(
        "Обновлять ссылки в файлах Link_Site.txt? (Enter - Да, n - Нет): ").strip().lower()
    update_links = update_links_input not in ['n', 'нет', 'no']

    subdirs = sorted([d for d in os.listdir(current_dir) if os.path.isdir(d) and not d.startswith('.')])

    if not subdirs:
        print("Подпапки категорий не найдены.")
        return

    new_folder_paths_list = []
    last_link = ""

    for category_folder in subdirs:
        category_path = os.path.join(current_dir, category_folder)
        items_inside = os.listdir(category_path)

        folders_to_process = [d for d in items_inside if
                              os.path.isdir(os.path.join(category_path, d)) and re.match(r'^\d+', d)]

        if not folders_to_process:
            continue

        folders_to_process.sort(key=lambda x: int(re.match(r'^\d+', x).group()))

        print(f"\n{'=' * 50}")
        print(f"=== Категория: {category_folder} (Папок: {len(folders_to_process)}) ===")

        # --- Спрашиваем платформу и суффикс для каждой категории ---
        platform = ask_platform()
        suffixes = ask_suffix()

        print(f"\n  Итог: {platform} {' + '.join(suffixes)} {today_date}")
        print(f"{'=' * 50}")

        for folder_name in folders_to_process:
            original_folder_path = os.path.join(category_path, folder_name)

            if len(suffixes) == 1:
                # Обычный режим — просто переименование
                last_link = process_folder(
                    category_path, category_folder, folder_name, platform, suffixes[0],
                    update_links, last_link, path_prefix, today_date, new_folder_paths_list
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

                # Первый суффикс — переименование оригинала
                first_suffix = suffixes[0]
                first_name = f"{clean_name} {platform} {first_suffix} {today_date}"
                first_path = os.path.join(category_path, first_name)
                try:
                    os.rename(original_folder_path, first_path)
                    new_folder_paths_list.append(f"{path_prefix}{category_folder}\\{first_name}")
                    print(f"     [OK] Папка WL: -> {first_name}")
                    for file in os.listdir(first_path):
                        if file.endswith(".xlsx"):
                            os.rename(os.path.join(first_path, file),
                                      os.path.join(first_path, f"{first_name}.xlsx"))
                            print(f"     [OK] Excel WL переименован")
                            break
                except Exception as e:
                    print(f"     [!] Ошибка WL: {e}")

                # Второй суффикс — копия
                second_suffix = suffixes[1]
                second_name = f"{clean_name} {platform} {second_suffix} {today_date}"
                second_path = os.path.join(category_path, second_name)
                try:
                    import shutil
                    shutil.copytree(first_path, second_path)
                    new_folder_paths_list.append(f"{path_prefix}{category_folder}\\{second_name}")
                    print(f"     [OK] Папка LU (копия): -> {second_name}")
                    for file in os.listdir(second_path):
                        if file.endswith(".xlsx"):
                            os.rename(os.path.join(second_path, file),
                                      os.path.join(second_path, f"{second_name}.xlsx"))
                            print(f"     [OK] Excel LU переименован")
                            break
                except Exception as e:
                    print(f"     [!] Ошибка LU копии: {e}")

    # Генерация текстовых файлов путей
    if new_folder_paths_list:
        print("\n" + "=" * 50)
        print("Генерация файлов путей...")
        with open("automation_folder_path1.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(new_folder_paths_list))

        path_list_1, path_list_2 = [], []
        for i, path in enumerate(new_folder_paths_list):
            if i % 2 == 0:
                path_list_1.append(path)
            else:
                path_list_2.append(path)

        with open("folder_path1.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(path_list_1))
        with open("folder_path2.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(path_list_2))
        print("Файлы путей созданы успешно.")

    print("=" * 50)
    print("Все задачи выполнены!")


if __name__ == "__main__":
    mass_rename_folders()
    input("\nНажмите Enter, чтобы выйти...")