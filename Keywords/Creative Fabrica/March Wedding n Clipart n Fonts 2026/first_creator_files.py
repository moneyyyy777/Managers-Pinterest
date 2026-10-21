import os

def create_files():
    # 1. Получаем путь к текущей папке и её имя
    current_path = os.getcwd()
    folder_name = os.path.basename(current_path)

    # 2. Спрашиваем пользователя
    choice = input("Dima or Mine? ").strip().lower()

    files_to_create = []

    if choice == "dima":
        # Сценарий для Dima
        files_to_create = [
            "Dima Tags.txt",
            "Pininspector.txt",
            "Pininspector + Seeds + Dima.txt",
            "Seed Tags.txt",
            f"{folder_name} (All).csv",
            f"{folder_name} (Dima).csv",
            f"{folder_name} (Filter by OpenAI).csv"
        ]
        print(f"Выбран режим Dima. Создаю {len(files_to_create)} файлов...")

    elif choice == "mine":
        # Сценарий для Mine
        files_to_create = [
            "Pininspector.txt",
            "Pininspector + Seeds.txt",
            "Seed Tags.txt",
            f"{folder_name} (All).csv",
            f"{folder_name} (Filter by OpenAI).csv"
        ]
        print(f"Выбран режим Mine. Создаю {len(files_to_create)} файлов...")

    else:
        print("Ошибка: Введите 'Dima' или 'Mine'. Программа завершена.")
        return

    # 3. Создание файлов
    for file_name in files_to_create:
        try:
            # Создаем пустой файл (если файл существует, он не будет перезаписан,
            # но если хочешь перезаписывать, используй 'w')
            with open(file_name, 'a', encoding='utf-8') as f:
                pass
            print(f"Создан: {file_name}")
        except Exception as e:
            print(f"Ошибка при создании {file_name}: {e}")

    print("\nГотово!")

if __name__ == "__main__":
    create_files()
    input("Нажмите Enter, чтобы выйти...")