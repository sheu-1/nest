import os

# 1. Replace #7a480d with #0a0501 in all auth files
auth_dir = os.path.join('app', '(auth)')
for f in os.listdir(auth_dir):
    if f.endswith(('.ts', '.tsx')):
        fp = os.path.join(auth_dir, f)
        with open(fp, 'r', encoding='utf-8') as file:
            content = file.read()
        new_content = content.replace('#7a480d', '#0a0501').replace('#C8511B', '#0a0501')
        if new_content != content:
            with open(fp, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Updated: {fp}")
