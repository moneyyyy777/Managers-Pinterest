import os


def create_intent_files():
    # 1. Папка продукта = папка где лежит скрипт
    product_path = os.path.dirname(os.path.abspath(__file__))
    product_name = os.path.basename(product_path)

    print(f"--- Режим создания Intent-файлов для продукта: {product_name} ---")

    # 2. Находим все нишевые подпапки
    niche_folders = []
    for item in sorted(os.listdir(product_path)):
        full_path = os.path.join(product_path, item)
        if os.path.isdir(full_path) and not item.startswith('.'):
            niche_folders.append((item, full_path))

    if not niche_folders:
        print("Нишевые подпапки не найдены.")
        input("Нажмите Enter, чтобы выйти...")
        return

    print(f"\nНайдено ниш: {len(niche_folders)}")
    for name, _ in niche_folders:
        print(f"  • {name}")

    print()

    # 3. Для каждой нишевой папки создаём intent-файлы
    for niche_name, niche_path in niche_folders:
        print(f"\n{'=' * 50}")
        print(f"[Ниша: {niche_name}]")
        print("Инструкция: Вводите название интента. Чтобы пропустить нишу — введите 's'. Чтобы завершить — '0' или Enter.")
        print("-" * 50)

        while True:
            choice = input(f"  Intent для [{niche_name}] (0/Enter = выход, s = пропустить нишу): ").strip()

            if choice.lower() in ['0', 'stop', 'exit', '']:
                print("  Завершение работы...")
                # Завершаем полностью
                print("\nВсе файлы созданы. Готово!")
                input("Нажмите Enter, чтобы закрыть окно...")
                return

            if choice.lower() == 's':
                print(f"  Ниша [{niche_name}] пропущена.")
                break

            # Формируем имя файла с именем ниши
            file_name = f"{niche_name} (Itent {choice}).txt"
            file_path = os.path.join(niche_path, file_name)

            try:
                with open(file_path, 'a', encoding='utf-8') as f:
                    pass
                print(f"  Создан: {file_name}")
            except Exception as e:
                print(f"  Ошибка при создании {file_name}: {e}")

            print("-" * 30)

    print("\nВсе файлы созданы. Готово!")


if __name__ == "__main__":
    create_intent_files()
    input("Нажмите Enter, чтобы закрыть окно...")
