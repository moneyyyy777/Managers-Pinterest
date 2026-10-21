import os
import random
import openpyxl

base_dir = "/Users/kalifornia/Desktop/Pinterest/Managers Pinterest/Keywords/Artify Studio/Christmas/Bundles"
output_file = "/Users/kalifornia/Desktop/Pinterest/Managers Pinterest/Keywords/Scripts for Faster/Module_Excel_Prompt_6/Audit_Report.md"

print(f"[*] Generating Audit Report...")
with open(output_file, 'w', encoding='utf-8') as f:
    f.write("# Аудит-отчет по генерации Excel файлов (Christmas Bundles)\n\n")
    f.write("Этот отчет содержит по 10 случайных строк из каждой папки для проверки качества (Match-to-Match).\n\n")
    
    for root, dirs, files in sorted(os.walk(base_dir)):
        for file in files:
            if file.endswith('.xlsx') and not file.startswith('~'):
                filepath = os.path.join(root, file)
                rel_path = os.path.relpath(root, base_dir)
                
                try:
                    wb = openpyxl.load_workbook(filepath, data_only=True)
                    sheet = wb.active
                    
                    # Gather all filled rows
                    rows_data = []
                    for row in range(2, 102): # We expect 100 rows starting from row 2
                        title = sheet.cell(row=row, column=14).value
                        desc = sheet.cell(row=row, column=12).value
                        cta = sheet.cell(row=row, column=13).value
                        if title and desc and cta:
                            rows_data.append((row, title, desc, cta))
                            
                    if not rows_data:
                        continue
                        
                    # Pick up to 10 evenly spaced rows to get a good spread, or random.
                    # Evenly spaced is better so we see start, middle, end.
                    step = max(1, len(rows_data) // 10)
                    sampled = rows_data[::step][:10]
                    
                    f.write(f"## Папка: `{rel_path}`\n")
                    f.write(f"Всего строк найдено: {len(rows_data)}\n\n")
                    f.write("| Строка | Title | Description | CTA |\n")
                    f.write("|---|---|---|---|\n")
                    
                    for row_num, t, d, c in sampled:
                        # Clean up newlines for markdown table
                        t = str(t).replace('\n', ' ')
                        d = str(d).replace('\n', ' ')
                        c = str(c).replace('\n', ' ')
                        f.write(f"| {row_num} | {t} | {d} | {c} |\n")
                        
                    f.write("\n---\n\n")
                except Exception as e:
                    print(f"[!] Error reading {filepath}: {e}")

print(f"[*] Audit report generated at: {output_file}")
