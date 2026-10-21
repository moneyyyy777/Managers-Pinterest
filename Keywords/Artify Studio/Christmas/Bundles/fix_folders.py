import os
import shutil

base_dir = "/Users/kalifornia/Desktop/Pinterest/Managers Pinterest/Keywords/Artify Studio/Christmas/Bundles"

for root, dirs, files in os.walk(base_dir):
    # We are looking for the 'For Main' directories inside Intent folders
    if os.path.basename(root) == "For Main":
        intent_dir = os.path.dirname(root)
        intent_name = os.path.basename(intent_dir)
        
        # We only care about Intent folders
        if "Intent" not in intent_name:
            continue
            
        print(f"Processing: {intent_name}")
        
        # 1. Rename Template.xlsx if it exists
        old_excel = os.path.join(intent_dir, "Template.xlsx")
        new_excel = os.path.join(intent_dir, f"{intent_name}.xlsx")
        if os.path.exists(old_excel):
            os.rename(old_excel, new_excel)
            
        # 2. Boards_Name.txt -> top tag from Boards_Tags.txt
        tags_file = os.path.join(root, "Boards_Tags.txt")
        name_file = os.path.join(root, "Boards_Name.txt")
        if os.path.exists(tags_file):
            with open(tags_file, 'r', encoding='utf-8') as f:
                tags = [line.strip() for line in f if line.strip()]
            if tags:
                # Get shortest tag or just the first one? Let's take the first one (highest volume usually since they were sorted)
                with open(name_file, 'w', encoding='utf-8') as f:
                    f.write(tags[0])
                    
        # 3. linksite.txt -> empty
        with open(os.path.join(root, "linksite.txt"), 'w', encoding='utf-8') as f:
            f.write("")
            
        # 4. sphere.txt -> Design
        with open(os.path.join(root, "sphere.txt"), 'w', encoding='utf-8') as f:
            f.write("Design")
            
        # 5 & 6. Determine subniche for generators
        subniche = "Bundles"
        if "Fonts" in intent_name: subniche = "Fonts"
        elif "Clipart" in intent_name: subniche = "Clipart"
        elif "SVG" in intent_name: subniche = "SVG"
        elif "Planners" in intent_name: subniche = "Planners"
        elif "Journaling" in intent_name: subniche = "Journaling"
        elif "Sublimation" in intent_name: subniche = "Sublimation"
        
        with open(os.path.join(root, "Name_Accounts.txt"), 'w', encoding='utf-8') as f:
            f.write("Christmas")
            
        with open(os.path.join(root, "Description_Generator.txt"), 'w', encoding='utf-8') as f:
            f.write(f"Design_Christmas_{subniche}")
            
print("Done fixing folders!")
