#!/usr/bin/env python3
# Fix NSS Libraries in all Dockerfiles

import os
import re

# The new NSS fix block
NSS_FIX = """# Fix NSS libraries issue - LibreOffice needs libssl3.so, libsmime3.so, libnss3.so, etc.
# Create symlinks for all NSS libraries from LibreOffice's own libs
RUN if [ -d /opt/libreoffice7.6/program ]; then \\
    cd /opt/libreoffice7.6/program && \\
    for lib in libssl3.so libsmime3.so libnss3.so libnssutil3.so libsoftokn3.so; do \\
        if [ ! -f /usr/lib64/$lib ]; then \\
            find . -name "$lib" -type f 2>/dev/null | head -1 | xargs -I {} ln -sf {} /usr/lib64/$lib 2>/dev/null || \\
            find /usr/lib64 -name "${lib%.so}.so.*" -type f 2>/dev/null | head -1 | xargs -I {} ln -sf {} /usr/lib64/$lib 2>/dev/null || \\
            echo "$lib symlink creation attempted"; \\
        fi; \\
    done; \\
    fi"""

dirs = ['word-to-pdf', 'ppt-to-pdf', 'pdf-to-word', 'pdf-to-excel', 'pdf-to-ppt']

for dir_name in dirs:
    dockerfile_path = os.path.join(dir_name, 'Dockerfile')
    if not os.path.exists(dockerfile_path):
        print(f"⚠️  {dockerfile_path} not found, skipping...")
        continue
    
    print(f"Fixing {dir_name}...")
    
    # Backup
    with open(dockerfile_path, 'r') as f:
        content = f.read()
    
    with open(f"{dockerfile_path}.backup", 'w') as f:
        f.write(content)
    
    # Remove old fix (from "# Fix libssl3.so issue" to "fi")
    lines = content.split('\n')
    new_lines = []
    skip = False
    for line in lines:
        if '# Fix libssl3.so issue' in line:
            skip = True
        if skip and line.strip() == 'fi' and line.startswith('    '):
            skip = False
            continue
        if not skip:
            new_lines.append(line)
    
    content = '\n'.join(new_lines)
    
    # Find line number of last libreoffice symlink line
    lines = content.split('\n')
    insert_line = -1
    for i, line in enumerate(lines):
        if 'ln -sf /opt/libreoffice7.6/program/soffice /usr/bin/libreoffice' in line:
            insert_line = i
    
    if insert_line == -1:
        print(f"⚠️  Could not find libreoffice symlink line in {dir_name}")
        continue
    
    # Insert fix after that line
    lines.insert(insert_line + 1, '')
    lines.insert(insert_line + 2, NSS_FIX)
    
    # Write back
    with open(dockerfile_path, 'w') as f:
        f.write('\n'.join(lines))
    
    print(f"✅ {dir_name} fixed!")

print("\n✅ NSS fix applied to all Dockerfiles!")

# Verify
print("\nVerifying word-to-pdf/Dockerfile:")
if os.path.exists('word-to-pdf/Dockerfile'):
    with open('word-to-pdf/Dockerfile', 'r') as f:
        content = f.read()
        lines = content.split('\n')
        in_fix = False
        count = 0
        for line in lines:
            if 'Fix NSS libraries' in line:
                in_fix = True
            if in_fix:
                print(line)
                count += 1
                if count > 12:
                    break














