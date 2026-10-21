import os
import re
import shutil
from datetime import datetime


def ask_platform():
    print("\n  Выберите платформу:")
    print("    1 - Cloudflare (Cloudflare)")
    print("    2 - Gooogle (Gole)")
    platform_input = input("Введите 1 или 2 (Enter = Cloudflare): ").strip()
    platform = "" if platform_input == "2" else "Cloudflare"
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


def process_folder(target_dir_path, folder_name, platform, suffix, update_links,
                   last_link, path_prefix, today_date, new_folder_paths_list, root_for_paths):
    clean_name = re.sub(r'\s+\S.*\s+\d{6}$', '', folder_name)
    print(f"\n  >>> Обработка: {clean_name}")

    old_folder_path = os.path.join(target_dir_path, folder_name)

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
    new_folder_path = os.path.join(target_dir_path, new_folder_name)

    try:
        if os.path.exists(old_folder_path):
            os.rename(old_folder_path, new_folder_path)
        elif os.path.exists(new_folder_path):
            pass

        # ГЕНЕРАЦИЯ ПУТИ: Автоматически вычисляет путь от родительской папки скрипта
        rel_path = os.path.relpath(new_folder_path, root_for_paths)
        full_generated_path = f"{path_prefix}{rel_path}".replace("/", "\\")  # Заменяем слеши на виндовские
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
    # Берем папку на уровень выше скрипта, чтобы с нее начинать писать пути в txt
    root_for_paths = os.path.dirname(current_dir)

    today_date = datetime.now().strftime("%d%m%y")
    path_prefix = r"..\Pinterest\Accounts Pinterest\\"

    print("--- Массовое обновление папок (Универсальный сканер) ---")
    print(f"Корневая папка для формирования путей: {os.path.basename(root_for_paths)}")

    update_links_input = input(
        "Обновлять ссылки в файлах Link_Site.txt? (Enter - Да, n - Нет): ").strip().lower()
    update_links = update_links_input not in ['n', 'нет', 'no']

    new_folder_paths_list = []
    last_link = ""

    # Собираем все папки, в которых есть вложенные папки с цифрами
    target_directories = []
    for root, dirs, files in os.walk(current_dir):
        # Игнорируем скрытые папки (начинающиеся с точки)
        dirs[:] = [d for d in dirs if not d.startswith('.')]

        # Ищем папки, начинающиеся с цифры
        numbered_dirs = [d for d in dirs if re.match(r'^\d+', d)]
        if numbered_dirs:
            target_directories.append((root, numbered_dirs))

    if not target_directories:
        print("\nПапки, начинающиеся с цифр, не найдены ни на одном уровне!")
        return

    # Обрабатываем найденные директории
    for target_path, folders_to_process in sorted(target_directories):
        folders_to_process.sort(key=lambda x: int(re.match(r'^\d+', x).group()))

        # Красивое отображение пути, где сейчас работает скрипт
        display_path = os.path.relpath(target_path, root_for_paths)

        print(f"\n{'=' * 60}")
        print(f"=== Локация: {display_path} (Папок: {len(folders_to_process)}) ===")

        platform = ask_platform()
        suffixes = ask_suffix()

        print(f"\n  Итог: {platform} {' + '.join(suffixes)} {today_date}")
        print(f"{'-' * 60}")

        for folder_name in folders_to_process:
            original_folder_path = os.path.join(target_path, folder_name)

            if len(suffixes) == 1:
                last_link = process_folder(
                    target_path, folder_name, platform, suffixes[0], update_links,
                    last_link, path_prefix, today_date, new_folder_paths_list, root_for_paths
                )
            else:
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

                first_suffix = suffixes[0]
                first_name = f"{clean_name} {platform} {first_suffix} {today_date}"
                first_path = os.path.join(target_path, first_name)
                try:
                    os.rename(original_folder_path, first_path)

                    # Генерация пути
                    rel_path1 = os.path.relpath(first_path, root_for_paths)
                    new_folder_paths_list.append(f"{path_prefix}{rel_path1}".replace("/", "\\"))

                    print(f"     [OK] Папка WL: -> {first_name}")
                    for file in os.listdir(first_path):
                        if file.endswith(".xlsx"):
                            os.rename(os.path.join(first_path, file),
                                      os.path.join(first_path, f"{first_name}.xlsx"))
                            print(f"     [OK] Excel WL переименован")
                            break
                except Exception as e:
                    print(f"     [!] Ошибка WL: {e}")

                second_suffix = suffixes[1]
                second_name = f"{clean_name} {platform} {second_suffix} {today_date}"
                second_path = os.path.join(target_path, second_name)
                try:
                    shutil.copytree(first_path, second_path)

                    # Генерация пути
                    rel_path2 = os.path.relpath(second_path, root_for_paths)
                    new_folder_paths_list.append(f"{path_prefix}{rel_path2}".replace("/", "\\"))

                    print(f"     [OK] Папка LU (копия): -> {second_name}")
                    for file in os.listdir(second_path):
                        if file.endswith(".xlsx"):
                            os.rename(os.path.join(second_path, file),
                                      os.path.join(second_path, f"{second_name}.xlsx"))
                            print(f"     [OK] Excel LU переименован")
                            break
                except Exception as e:
                    print(f"     [!] Ошибка LU копии: {e}")

    if new_folder_paths_list:
        print("\n" + "=" * 60)
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

    print("=" * 60)
    print("Все задачи выполнены!")


if __name__ == "__main__":
    mass_rename_folders()
    input("\nНажмите Enter, чтобы выйти...")