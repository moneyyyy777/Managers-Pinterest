import os

def create_intent_files():
    # 1. Получаем путь к текущей папке и её имя
    current_path = os.getcwd()
    folder_name = os.path.basename(current_path)

    print(f"--- Режим создания Intent-файлов для папки: {folder_name} ---")
    print("Инструкция: Вводите название интента. Чтобы закончить, введите '0' или просто нажмите Enter.")
    print("-" * 50)

    while True:
        # 2. Спрашиваем пользователя название интента
        choice = input("Введите название Intent (или '0' для выхода): ").strip()

        # Условие выхода из цикла
        if choice.lower() in ['0', 'хватит', 'stop', 'exit', '']:
            print("Завершение работы...")
            break

        # Формируем имя файла
        # (Я оставил твое написание 'Itent', если нужно 'Intent' — просто поправь букву)
        file_name = f"{folder_name} (Itent {choice}).txt"

        try:
            # 3. Создание файла
            with open(file_name, 'a', encoding='utf-8') as f:
                pass
            print(f"Успешно создан: {file_name}")
        except Exception as e:
            print(f"Ошибка при создании {file_name}: {e}")

        print("-" * 30)

    print("\nВсе файлы созданы. Готово!")


if __name__ == "__main__":
    create_intent_files()
    input("Нажмите Enter, чтобы закрыть окно...")