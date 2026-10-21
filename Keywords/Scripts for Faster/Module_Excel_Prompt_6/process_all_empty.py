import os
import sys
import subprocess
import openpyxl

base_dir = "/Users/kalifornia/Desktop/Pinterest/Managers Pinterest/Keywords/Artify Studio/Christmas/Bundles"
module_dir = os.path.dirname(__file__)
run_script = os.path.join(module_dir, "run_folder.py")

empty_folders = []

print("[*] Scanning for empty Excel files...")
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.xlsx') and not f.startswith('~'):
            filepath = os.path.join(root, f)
            wb = openpyxl.load_workbook(filepath, data_only=True)
            sheet = wb.active
            if not sheet.cell(row=2, column=12).value:
                empty_folders.append(root)

print(f"[*] Found {len(empty_folders)} empty folders to process.")

for idx, folder in enumerate(empty_folders, 1):
    print(f"\n========================================================")
    print(f"[*] Processing Folder {idx}/{len(empty_folders)}: {os.path.basename(folder)}")
    print(f"========================================================")
    
    # Run the run_folder script
    res = subprocess.run([sys.executable, "-u", run_script, folder])
    if res.returncode != 0:
        print(f"[!] ERROR processing {folder}. Stopping batch.")
        sys.exit(1)
        
print("\n[*] ALL FOLDERS PROCESSED SUCCESSFULLY!")
