import os
import glob

# Files to update
files_to_update = [
    r"src\app\history\page.tsx",
    r"src\app\sync\page.tsx",
    r"src\app\sources\page.tsx",
    r"src\app\scan-history\[scanId]\page.tsx",
    r"src\app\dashboard\page.tsx",
    r"src\app\companies\page.tsx",
    r"src\app\api-config\page.tsx",
    r"src\features\communicationTPR\components\Layout.tsx"
]

for file_path in files_to_update:
    full_path = os.path.join(r"c:\Users\aksv4\Desktop\Job-Finder\frontend", file_path)
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace max-w-7xl mx-auto with w-full
        new_content = content.replace('max-w-7xl mx-auto', 'w-full max-w-none')
        # Handle cases where it might be written slightly differently
        new_content = new_content.replace('mx-auto max-w-7xl', 'w-full max-w-none')
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")
    else:
        print(f"Not found: {file_path}")

# Let's also do communicationTPR pages if any
comm_pages = glob.glob(r"c:\Users\aksv4\Desktop\Job-Finder\frontend\src\app\communication-tpr\**\page.tsx", recursive=True)
for full_path in comm_pages:
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = content.replace('max-w-7xl mx-auto', 'w-full max-w-none')
    new_content = new_content.replace('mx-auto max-w-7xl', 'w-full max-w-none')
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated comm: {full_path}")
