import re
import json
from pathlib import Path

class CSSCleaner:
    def __init__(self):
        self.class_map = {}  # {class_name: {file_number: definition}}

    def extract_classes(self, content):
        # Match any CSS selector pattern followed by rules
        pattern = r'([^{]+)\{([^}]+)\}'
        matches = re.finditer(pattern, content)
        classes = {}

        for match in matches:
            selector = match.group(1).strip()
            rules = match.group(2).strip()
            definition = f"{selector} {{\n{rules}\n}}"

            # Skip if no class selector found
            if '.' not in selector:
                continue

            # Extract base class name (first class in selector)
            base_class_match = re.search(r'\.([^:\s.>+~[\]]+)', selector)
            if not base_class_match:
                continue

            base_class = base_class_match.group(1)
            selector_key = selector

            classes[selector_key] = {
                'base_class': base_class,
                'full_selector': selector,
                'definition': definition.strip()
            }

        return classes

    def add_to_class_map(self, file_number, classes):
        """Add classes to the class map with their full selectors"""
        for selector_key, info in classes.items():
            base_class = info['base_class']
            if base_class not in self.class_map:
                self.class_map[base_class] = {}

            if selector_key not in self.class_map[base_class]:
                self.class_map[base_class][selector_key] = {
                    'files': [],
                    'definitions': {}
                }

            self.class_map[base_class][selector_key]['files'].append(file_number)
            self.class_map[base_class][selector_key]['definitions'][str(file_number)] = info['definition']

    def scan_file(self, file_number):
        file_path = Path(f'src/L_1_HomePage{file_number}.css')
        if not file_path.exists():
            print(f"Warning: {file_path} not found")
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        classes = self.extract_classes(content)
        self.add_to_class_map(file_number, classes)

    def scan_all_files(self):
        for i in range(1, 7):
            self.scan_file(i)

    def find_duplicates(self):
        duplicates = {}
        by_file = {}  # Track duplicates per file
        total_duplicates = 0

        for base_class, selectors in self.class_map.items():
            for selector_key, info in selectors.items():
                if len(info['files']) > 1:
                    if base_class not in duplicates:
                        duplicates[base_class] = {}

                    duplicates[base_class][selector_key] = {
                        "files": info['files'],
                        "definitions": info['definitions']
                    }

                    # Count duplicates per file (excluding the last file)
                    sorted_files = sorted(info['files'])
                    for file_num in sorted_files[:-1]:
                        by_file[str(file_num)] = by_file.get(str(file_num), 0) + 1
                    # Add to total (excluding one original instance)
                    total_duplicates += len(info['files']) - 1

        # Create report with summary
        report = {
            "classes": duplicates,
            "summary": {
                "total_duplicates": total_duplicates,
                "unique_duplicates": sum(len(selectors) for selectors in duplicates.values()),
                "files_affected": len(by_file),
                "by_file": by_file
            }
        }

        # Write to JSON file
        with open('removed_classes.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        return report

def main():
    cleaner = CSSCleaner()
    cleaner.scan_all_files()
    report = cleaner.find_duplicates()

    # Print summary
    print("\nDuplicate Classes Summary:")
    print(f"Total duplicate instances: {report['summary']['total_duplicates']}")
    print(f"Unique duplicate classes: {report['summary']['unique_duplicates']}")
    print(f"Files affected: {report['summary']['files_affected']}")
    print("\nDuplicates by file:")
    for file_num, count in sorted(report['summary']['by_file'].items()):
        print(f"  File {file_num}: {count} duplicates")

    print("\nDetailed class breakdown:")
    for base_class, selectors in report['classes'].items():
        print(f"\nBase class: {base_class}")
        for selector, info in selectors.items():
            print(f"  Selector: {selector}")
            print(f"  Appears in files: {info['files']}")

if __name__ == "__main__":
    main()
