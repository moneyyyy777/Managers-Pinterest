import os
import re
from datetime import datetime


def mass_rename_folders():
    current_dir = os.getcwd()
    today_date = datetime.now().strftime("%d%m%y")

    # Префикс для путей в текстовых файлах
    path_prefix = r"..\Pinterest\Accounts Pinterest\\"

    print("--- Массовое обновление папок (Вложенный режим) ---")

    # 1. Запрос режима работы
    update_links_input = input(
        "Обновлять ссылки в файлах Link_Site.txt? (Enter - Да, n - Нет/Только переименование): ").strip().lower()
    update_links = update_links_input not in ['n', 'нет', 'no']

    # 2. Платформа
    platform_input = input("Какая платформа - Gooogle? (нажмите Enter если да, или введите название): ").strip()
    # Здесь мы жестко задаем Gooogle (3 буквы 'o'), если нажат Enter
    platform = "Gooogle" if platform_input.lower() in ['', 'да', 'yes', 'y', 'д', 'gooogle'] else platform_input

    # 3. Получаем список всех категорий
    subdirs = [d for d in os.listdir(current_dir) if os.path.isdir(d) and not d.startswith('.')]

    if not subdirs:
        print("Подпапки категорий не найдены.")
        return

    new_folder_paths_list = []
    last_link = ""

    for category_folder in subdirs:
        category_path = os.path.join(current_dir, category_folder)
        items_inside = os.listdir(category_path)

        # Находим папки, начинающиеся с цифр
        folders_to_process = [d for d in items_inside if
                              os.path.isdir(os.path.join(category_path, d)) and re.match(r'^\d+', d)]

        if not folders_to_process:
            continue

        print(f"\n=== Категория: {category_folder} (Папок: {len(folders_to_process)}) ===")

        # Сортировка по цифрам в начале
        folders_to_process.sort(key=lambda x: int(re.match(r'^\d+', x).group()))

        for folder_name in folders_to_process:
            # --- ОЧИСТКА ИМЕНИ ---
            # Убираем из старого имени платформу и дату, если они там уже есть (например, "Google 140126" или "Gooogle 140126")
            # Ищем паттерн: пробел + любое слово + пробел + 6 цифр в конце строки
            clean_name = re.sub(r'\s+\w+\s+\d{6}$', '', folder_name)

            print(f"\n>>> Обработка: {clean_name}")

            # Работа со ссылками
            old_folder_path = os.path.join(category_path, folder_name)
            if update_links:
                prompt = f"   Введите ссылку"
                if last_link: prompt += f" (Enter для {last_link})"
                current_link = input(f"{prompt}: ").strip()
                if not current_link and last_link:
                    current_link = last_link
                else:
                    last_link = current_link

                link_file_dir = os.path.join(old_folder_path, "For Main")
                link_file_path = os.path.join(link_file_dir, "Link_Site.txt")
                try:
                    os.makedirs(link_file_dir, exist_ok=True)
                    with open(link_file_path, "w", encoding="utf-8") as f:
                        f.write(current_link)
                    print(f"   [OK] Ссылка записана")
                except Exception as e:
                    print(f"   [!] Ошибка записи ссылки: {e}")

            # ФОРМИРУЕМ НОВОЕ ИМЯ
            # Теперь приклеиваем платформу к очищенному имени
            new_folder_name = f"{clean_name} {platform} {today_date}"
            new_folder_path = os.path.join(category_path, new_folder_name)

            try:
                # Переименовываем папку
                os.rename(old_folder_path, new_folder_path)

                # Сохраняем путь
                full_generated_path = f"{path_prefix}{category_folder}\\{new_folder_name}"
                new_folder_paths_list.append(full_generated_path)
                print(f"   [OK] Папка: -> {new_folder_name}")

                # Переименовываем Excel внутри
                for file in os.listdir(new_folder_path):
                    if file.endswith(".xlsx"):
                        old_file_path = os.path.join(new_folder_path, file)
                        new_file_name = f"{new_folder_name}.xlsx"
                        os.rename(old_file_path, os.path.join(new_folder_path, new_file_name))
                        print(f"   [OK] Excel переименован")
                        break
            except Exception as e:
                print(f"   [!] Ошибка переименования: {e}")

    # Генерация текстовых файлов
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
        print(f"Файлы путей созданы успешно.")

    print("=" * 50)
    print("Все задачи выполнены!")


if __name__ == "__main__":
    mass_rename_folders()
    input("\nНажмите Enter, чтобы выйти...")