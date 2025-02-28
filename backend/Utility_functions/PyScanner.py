import os
import re

# === Configuration: Set the target directory and search phrases ===
DESTINATION_DIRECTORY = r"C:\Users\md8w7\OneDrive University of Missouri\Desktop\ImportantFiles\Milestone4\backend"
TARGET_PHRASES = ["property_mapping", "common_utils", "12.64"]  # List of phrases to search for
EXCLUDED_PHRASES = ["PyScanner", "ID_Replace_Python", "ID_Replace_Python_Final"]  # List of phrases to exclude files from the search
SKIP_FOLDERS=["__pycache__", "venv", ".git"]  # List of folders to skip during the search
# === New Configuration: Specific targets ===
SPECIFIC = False  # Set this to True to enable specific file matching
SPECIFIC_TARGET_FILES = ["CFA copy.py", "example2.py"]  # List of specific files to search

# === Log file path ===
LOG_FILE_PATH = os.path.join(DESTINATION_DIRECTORY, 'ID_Scan_Python.log')

def initialize_log():
    """Clear previous content and initialize the log file."""
    with open(LOG_FILE_PATH, 'w', encoding='utf-8') as log_file:
        log_file.write(f"=== Search for Phrases ===\n")
        log_file.write(f"Target phrases: {', '.join(TARGET_PHRASES)}\n")
        log_file.write(f"Excluding files containing: {', '.join(EXCLUDED_PHRASES)}\n")
        if SPECIFIC:
            log_file.write(f"Specific target files: {', '.join(SPECIFIC_TARGET_FILES)}\n")
        log_file.write("\n")

def log_matches(matches):
    """Write matches to the log file in tabular format."""
    summary_header = "=== Summary of Matches ===\n\n"
    table_header = "| # | Phrase | File Path | Line | Content |\n" + \
                   "|---|--------|-----------|------|---------|\n"

    table_rows = "\n".join(
        f"| {i + 1} | {match['phrase']} | {match['file']} | {match['line']} | {match['content']} |"
        for i, match in enumerate(matches)
    )

    summary_content = table_header + table_rows if matches else "No matches found.\n"

    with open(LOG_FILE_PATH, 'a', encoding='utf-8') as log_file:
        log_file.write(summary_header + summary_content)

def is_excluded_file(filename):
    """Check if a file should be excluded based on its name."""
    return any(excluded in filename for excluded in EXCLUDED_PHRASES)

def search_in_file(file_path, target_phrases):
    """Search for target phrases in a single file."""
    patterns = {phrase: re.compile(re.escape(phrase), re.IGNORECASE) for phrase in target_phrases}
    matches = []

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        for i, line in enumerate(lines):
            for phrase, pattern in patterns.items():
                if pattern.search(line):
                    matches.append({
                        'phrase': phrase,
                        'file': os.path.relpath(file_path, DESTINATION_DIRECTORY),
                        'line': i + 1,
                        'content': line.strip()
                    })

    except Exception as e:
        print(f"Error reading {file_path}: {e}")

    return matches

def scan_directory(directory, target_phrases, specific_files=None):
    """Search for phrases in specified or all Python files."""
    matches = []

    if specific_files:
        # Scan only specific files
        for specific_file in specific_files:
            file_path = os.path.join(directory, specific_file)
            if os.path.isfile(file_path):
                matches.extend(search_in_file(file_path, target_phrases))
            else:
                print(f"Specified file not found: {specific_file}")
    else:
        # Scan all Python files in the directory
        for root, dirs, files in os.walk(directory):
            dirs[:] = [d for d in dirs if d not in SKIP_FOLDERS]

            for file in files:
                if file.endswith(".py") and not is_excluded_file(file):
                    file_path = os.path.join(root, file)
                    matches.extend(search_in_file(file_path, target_phrases))

    return matches

def main():
    """Main function to initialize log, perform scan, and log results."""
    initialize_log()
    matches = scan_directory(
        DESTINATION_DIRECTORY, 
        TARGET_PHRASES, 
        SPECIFIC_TARGET_FILES if SPECIFIC else None
    )
    log_matches(matches)
    print(f"Scan completed. Results are logged in: {LOG_FILE_PATH}")

# Run the main function
if __name__ == "__main__":
    main()
