## rename the file in current folder, remove raw_ prefix
import os

folder_path = "backend/datasets/PD5D_MTG_VisiumST/images"
file_ls = os.listdir(folder_path)
for f in file_ls:
    if f.startswith('image_'):
        old_path = os.path.join(folder_path, f)
        new_name = f.replace('image_slice1', 'image', 1)  # Remove first occurrence of 'raw_'
        new_path = os.path.join(folder_path, new_name)
        os.rename(old_path, new_path)
        print(f"Renamed: {f} -> {new_name}")