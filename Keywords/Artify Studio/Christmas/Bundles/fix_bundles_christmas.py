import os
import shutil

base_dir = "/Users/kalifornia/Desktop/Pinterest/Managers Pinterest/Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas"
template_dir = "/Users/kalifornia/Desktop/Pinterest/Managers Pinterest/All Folders/Artify Studio/Cliparts/All Cliparts/Template"

for item in os.listdir(base_dir):
    intent_dir = os.path.join(base_dir, item)
    if os.path.isdir(intent_dir) and "Intent" in item:
        print(f"Fixing {item}...")
        
        # 1. Remove artifact directories
        for artifact in ["All Cliparts", "Baby Cliparts", "Watercolor Cliparts"]:
            artifact_path = os.path.join(intent_dir, artifact)
            if os.path.exists(artifact_path):
                shutil.rmtree(artifact_path)
                
        # 2. Copy missing files/folders from Template
        for t_item in os.listdir(template_dir):
            t_src = os.path.join(template_dir, t_item)
            t_dst = os.path.join(intent_dir, t_item)
            
            # Skip For Main since we already have it with generated tags, but copy missing stuff if any?
            if t_item == "For Main":
                # Only copy files that don't exist in For Main
                for fm_item in os.listdir(t_src):
                    fm_src = os.path.join(t_src, fm_item)
                    fm_dst = os.path.join(intent_dir, "For Main", fm_item)
                    if not os.path.exists(fm_dst):
                        if os.path.isdir(fm_src):
                            shutil.copytree(fm_src, fm_dst)
                        else:
                            shutil.copy2(fm_src, fm_dst)
                continue
                
            if not os.path.exists(t_dst):
                if os.path.isdir(t_src):
                    shutil.copytree(t_src, t_dst)
                else:
                    shutil.copy2(t_src, t_dst)
                    
        # 3. Rename Template.xlsx
        old_excel = os.path.join(intent_dir, "Template.xlsx")
        new_excel = os.path.join(intent_dir, f"{item}.xlsx")
        if os.path.exists(old_excel):
            os.rename(old_excel, new_excel)
            
print("Fix completed!")
