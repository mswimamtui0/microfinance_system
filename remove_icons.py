
import os
import re
import sys
from pathlib import Path

# Define patterns to match icons and emojis
ICON_PATTERNS = [
    # Heroicons and other icon imports
    r"from ['\"]@heroicons/react/24/(outline|solid)['\"] import .*",
    r"import {.*?} from ['\"]@heroicons/react/24/(outline|solid)['\"]",
    
    # React Icons
    r"from ['\"]react-icons/.*['\"] import .*",
    r"import {.*?} from ['\"]react-icons/.*['\"]",
    
    # Font Awesome
    r"from ['\"]@fortawesome/react-fontawesome['\"] import .*",
    r"import {.*?} from ['\"]@fortawesome/react-fontawesome['\"]",
    r"<FontAwesomeIcon .*?/>",
    
    # Material-UI Icons
    r"from ['\"]@mui/icons-material/.*['\"] import .*",
    r"import {.*?} from ['\"]@mui/icons-material/.*['\"]",
    
    # Ant Design Icons
    r"from ['\"]@ant-design/icons['\"] import .*",
    r"import {.*?} from ['\"]@ant-design/icons['\"]",
    r"<.*?Icon .*?/>",
]

# Emoji patterns (Unicode emojis)
EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # Emoticons
    "\U0001F300-\U0001F5FF"  # Symbols & pictographs
    "\U0001F680-\U0001F6FF"  # Transport & map symbols
    "\U0001F700-\U0001F77F"  # Alchemical symbols
    "\U0001F780-\U0001F7FF"  # Geometric shapes
    "\U0001F800-\U0001F8FF"  # Supplemental arrows-C
    "\U0001F900-\U0001F9FF"  # Supplemental symbols and pictographs
    "\U0001FA00-\U0001FA6F"  # Chess symbols
    "\U0001FA70-\U0001FAFF"  # Symbols and pictographs extended-A
    "\U00002702-\U000027B0"  # Dingbats
    "\U000024C2-\U0001F251"  # Enclosed characters
    "]+",
    flags=re.UNICODE
)

def remove_icons_from_file(file_path):
    """Remove icons and emojis from a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False
        
        # Remove icon imports
        for pattern in ICON_PATTERNS:
            matches = re.findall(pattern, content, re.MULTILINE)
            if matches:
                content = re.sub(pattern, '', content, flags=re.MULTILINE)
                modified = True
        
        # Remove emojis
        if EMOJI_PATTERN.search(content):
            content = EMOJI_PATTERN.sub('', content)
            modified = True
        
        # Remove empty lines from imports (cleanup)
        if modified:
            # Remove empty lines and multiple newlines
            content = re.sub(r'\n\s*\n', '\n\n', content)
            # Remove trailing whitespace
            content = content.rstrip() + '\n'
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            if content != original_content:
                print(f"  ✅ Modified: {file_path}")
                return True
    
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
    
    return False

def process_directory(directory, extensions=['.js', '.jsx', '.ts', '.tsx']):
    """Process all files in a directory"""
    directory = Path(directory)
    if not directory.exists():
        print(f"❌ Directory not found: {directory}")
        return
    
    print(f"\n📁 Processing: {directory}")
    print("=" * 60)
    
    modified_count = 0
    
    for ext in extensions:
        for file_path in directory.rglob(f"*{ext}"):
            if 'node_modules' in str(file_path) or '.git' in str(file_path):
                continue
            if remove_icons_from_file(file_path):
                modified_count += 1
    
    print("=" * 60)
    print(f"✅ Modified {modified_count} files")
    return modified_count

def main():
    """Main function"""
    print("=" * 60)
    print("  🔧 Removing Icons and Emojis from Project")
    print("=" * 60)
    
    # Get project root
    project_root = Path(__file__).parent
    
    # Process frontend src directory
    frontend_src = project_root / 'frontend' / 'src'
    if frontend_src.exists():
        process_directory(frontend_src)
    
    print("\n✅ Done! All icons and emojis have been removed.")
    print("⚠️  Note: This may break some UI components. You may need to re-add icons manually.")

if __name__ == "__main__":
    main()