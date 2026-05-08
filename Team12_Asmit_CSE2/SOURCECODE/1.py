import os
import pandas as pd

folder_path = "pdf_folder_path"
csv_file = "names.csv"

# CSV read karo
df = pd.read_csv(csv_file)

pdf_files = sorted(os.listdir(folder_path))

for i, file in enumerate(pdf_files):
    if file.endswith(".pdf"):
        old_path = os.path.join(folder_path, file)
        new_name = df.iloc[i][0] + ".pdf"   # first column se name
        new_path = os.path.join(folder_path, new_name)
        
        os.rename(old_path, new_path)

print("Renaming done ✅")