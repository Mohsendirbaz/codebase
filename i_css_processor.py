import json
import re
from pathlib import Path

class CSSProcessor:
    def __init__(self):
        self.duplicates = {}
        self.to_remove = {}  # {file_number: [classes_to_remove]}

    def load_duplicates(self):
        with open('removed_classes.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.duplicates = data['classes']  # Get the classes from the new format

    def process_duplicates(self):
        """Process duplicates keeping only the last definition of each class"""
        for base_class, selectors in self.duplicates.items():
            for selector_key, info in selectors.items():
                files = sorted(map(int, info['files']))  # Convert to int for proper sorting
                # Keep only the last file's definition
                last_file = str(files[-1])

                # Mark earlier definitions for removal
                for file_num in files[:-1]:
                    file_num = str(file_num)
                    if file_num not in self.to_remove:
                        self.to_remove[file_num] = []
                    self.to_remove[file_num].append({
                        'class': base_class,
                        'selector': selector_key,
                        'definition': info['definitions'][file_num]
                    })

    def remove_from_files(self):
        """Remove overridden classes from CSS files"""
        for file_num, classes in self.to_remove.items():
            file_path = Path(f'src/L_1_HomePage{file_num}.css')
            if not file_path.exists():
                print(f"Warning: {file_path} not found")
                continue

            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Remove each class definition
            for class_info in classes:
                definition = class_info['definition']
                # Escape special characters for regex
                escaped_def = re.escape(definition)
                # Remove the definition and any following whitespace
                content = re.sub(f"{escaped_def}\\s*", '', content)

            # Write the updated content back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

    def generate_report(self):
        """Generate a report of removed classes"""
        report = {
            'removed_classes': {},
            'summary': {
                'total_removed': 0,
                'files_affected': len(self.to_remove)
            }
        }

        total_removed = 0
        for file_num, classes in self.to_remove.items():
            report['removed_classes'][f'file_{file_num}'] = {
                'count': len(classes),
                'classes': [{
                    'base_class': c['class'],
                    'full_selector': c['selector'],
                    'definition': c['definition']
                } for c in classes]
            }
            total_removed += len(classes)

        report['summary']['total_removed'] = total_removed

        # Write report
        with open('removal_report.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)

        return report

def main():
    processor = CSSProcessor()

    print("Loading duplicate classes...")
    processor.load_duplicates()

    print("\nProcessing duplicates...")
    processor.process_duplicates()

    print("\nRemoving overridden classes from files...")
    processor.remove_from_files()

    print("\nGenerating report...")
    report = processor.generate_report()

    print("\nSummary:")
    print(f"Total classes removed: {report['summary']['total_removed']}")
    print(f"Files affected: {report['summary']['files_affected']}")
    print("\nDetailed report saved to 'removal_report.json'")

if __name__ == "__main__":
    main()
