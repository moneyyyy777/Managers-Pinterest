import os
import shutil


def create_files():
    # 1. Папка продукта = папка где лежит скрипт
    product_path = os.path.dirname(os.path.abspath(__file__))
    product_name = os.path.basename(product_path)

    print(f"--- Продукт: {product_name} ---")

    # 2. Создаём linksite.txt в папке продукта (если не существует)
    linksite_path = os.path.join(product_path, "linksite.txt")
    if not os.path.exists(linksite_path):
        link = input("Введите ссылку на продукт (linksite.txt): ").strip()
        with open(linksite_path, 'w', encoding='utf-8') as f:
            f.write(link)
        print(f"Создан: linksite.txt")
    else:
        print(f"linksite.txt уже существует, пропускаем.")

    # 3. Находим все нишевые подпапки для первого этапа (создание файлов)
    niche_folders = []
    for item in sorted(os.listdir(product_path)):
        full_path = os.path.join(product_path, item)
        if os.path.isdir(full_path) and not item.startswith('.'):
            niche_folders.append((item, full_path))

    # === БЛОК 1: Создание файлов, если папки существуют ===
    if niche_folders:
        print(f"\nНайдено ниш для создания файлов: {len(niche_folders)}")
        for name, _ in niche_folders:
            print(f"  • {name}")

        choice = input("\nDima or Mine? ").strip().lower()

        for niche_name, niche_path in niche_folders:
            print(f"\n[Ниша: {niche_name}]")

            if choice == "dima":
                files_to_create = [
                    "Dima Tags.txt",
                    "Pininspector.txt",
                    "Pininspector + Seeds + Dima.txt",
                    "Seed Tags.txt",
                    f"{niche_name} (All).csv",
                    f"{niche_name} (Dima).csv",
                    f"{niche_name} (Filter by OpenAI).csv"
                ]
            elif choice == "mine":
                files_to_create = [
                    "Pininspector.txt",
                    "Pininspector + Seeds.txt",
                    "Seed Tags.txt",
                    f"{niche_name} (All).csv",
                    f"{niche_name} (Filter by OpenAI).csv"
                ]
            else:
                print("Ошибка: Введено не 'Dima' и не 'Mine'. Пропускаем создание файлов в текущих папках.")
                break

            for file_name in files_to_create:
                file_path = os.path.join(niche_path, file_name)
                try:
                    with open(file_path, 'a', encoding='utf-8') as f:
                        pass
                    print(f"  Создан: {file_name}")
                except Exception as e:
                    print(f"  Ошибка при создании {file_name}: {e}")
    else:
        print("\nНишевые подпапки для ручного создания файлов не найдены. Пропускаем этот шаг.")

    # === БЛОК 2: Копирование готовых ниш ===
    print("\n" + "=" * 40)
    answer = input("Есть ли уже подходящие ниши с готовыми тегами под данный товар? (да/нет): ").strip().lower()

    if answer in ['да', 'yes', 'д', 'y']:
        ready_niches_path = '/Managers Pinterest/Keywords/!Niches'

        if not os.path.exists(ready_niches_path):
            print(f"\nОшибка: Папка не найдена по пути: {ready_niches_path}")
        else:
            available_folders = [f for f in sorted(os.listdir(ready_niches_path))
                                 if os.path.isdir(os.path.join(ready_niches_path, f)) and not f.startswith('.')]

            if not available_folders:
                print("В папке Niches нет доступных папок.")
            else:
                while True:
                    print("\n--- Доступные готовые ниши ---")
                    for i, folder_name in enumerate(available_folders, 1):
                        print(f"{i}. {folder_name}")

                    user_choice = input(
                        "\nВведите номер папки, которую хотите скопировать (или напишите 'стоп'): ").strip().lower()

                    if user_choice in ['стоп', 'stop']:
                        print("Копирование завершено.")
                        break

                    if user_choice.isdigit():
                        folder_index = int(user_choice) - 1

                        if 0 <= folder_index < len(available_folders):
                            chosen_folder = available_folders[folder_index]
                            source_dir = os.path.join(ready_niches_path, chosen_folder)

                            # Проверяем: есть ли внутри выбранной папки вложенные подпапки
                            inner_subdirs = [
                                f for f in sorted(os.listdir(source_dir))
                                if os.path.isdir(os.path.join(source_dir, f)) and not f.startswith('.')
                            ]

                            # --- НОВЫЙ БЛОК: если внутри есть подпапки — спрашиваем ---
                            if inner_subdirs:
                                print(f"\n[!] Внутри папки '{chosen_folder}' найдены подпапки:")
                                for sub in inner_subdirs:
                                    print(f"    • {sub}")

                                sub_answer = input(
                                    "\nКопировать эти подпапки (а не саму папку)? (да/нет): "
                                ).strip().lower()

                                if sub_answer in ['да', 'yes', 'д', 'y']:
                                    # Копируем каждую подпапку отдельно, как если бы она была выбрана напрямую
                                    for sub_name in inner_subdirs:
                                        sub_source = os.path.join(source_dir, sub_name)
                                        new_folder_name = f"{product_name} {sub_name}"
                                        destination_dir = os.path.join(product_path, new_folder_name)

                                        if os.path.exists(destination_dir):
                                            print(f"\n[!] Папка '{new_folder_name}' уже существует. Пропускаем.")
                                            continue

                                        try:
                                            shutil.copytree(sub_source, destination_dir)
                                            print(f"\n[+] Подпапка скопирована и переименована в: '{new_folder_name}'")

                                            # Переименовываем файлы внутри
                                            _rename_files_in_folder(destination_dir, product_name)

                                        except Exception as e:
                                            print(f"\n[!] Ошибка при копировании '{sub_name}': {e}")

                                    continue  # Возвращаемся к выбору следующей папки
                                # Если ответ "нет" — падаем дальше и копируем как обычно (всю папку)

                            # --- Стандартный путь: копируем всю папку ---
                            new_folder_name = f"{product_name} {chosen_folder}"
                            destination_dir = os.path.join(product_path, new_folder_name)

                            if os.path.exists(destination_dir):
                                print(f"\n[!] Папка '{new_folder_name}' уже существует здесь. Выберите другую.")
                                continue

                            try:
                                shutil.copytree(source_dir, destination_dir)
                                print(f"\n[+] Папка скопирована и переименована в: '{new_folder_name}'")
                                _rename_files_in_folder(destination_dir, product_name)

                            except Exception as e:
                                print(f"\n[!] Ошибка при копировании или переименовании: {e}")
                        else:
                            print("\n[!] Ошибка: Папки с таким номером нет в списке.")
                    else:
                        print("\n[!] Ошибка: Введите корректный номер или слово 'стоп'.")

    print("\nГотово! Скрипт полностью завершил работу.")


def _rename_files_in_folder(folder_path: str, product_name: str):
    """Переименовывает .csv и Intent .txt файлы внутри папки, добавляя имя продукта."""
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path):
            if filename.endswith('.csv') or (filename.endswith('.txt') and 'itent' in filename.lower()):
                new_filename = f"{product_name} {filename}"
                new_file_path = os.path.join(folder_path, new_filename)
                os.rename(file_path, new_file_path)
                print(f"    -> Переименован файл: {new_filename}")


if __name__ == "__main__":
    create_files()
    input("\nНажмите Enter, чтобы выйти...")