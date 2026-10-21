import os
import re

base_dir = "/Users/kalifornia/Desktop/Pinterest/Managers Pinterest/Keywords/Artify Studio/Christmas/Bundles"
fixed_count = 0

for root, dirs, files in os.walk(base_dir):
    if os.path.basename(root) == "For Main":
        name_file = os.path.join(root, "Boards_Name.txt")
        if os.path.exists(name_file):
            with open(name_file, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                
            if content:
                # 1. Отсекаем всё, что после ;
                clean_name = content.split(';')[0].strip()
                # 2. Делаем Title Case
                title_case_name = clean_name.title()
                
                with open(name_file, 'w', encoding='utf-8') as f:
                    f.write(title_case_name)
                
                fixed_count += 1
                
print(f"Успешно исправлено Boards_Name в {fixed_count} папках.")
