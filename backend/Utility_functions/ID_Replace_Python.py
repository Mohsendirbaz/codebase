import os
import re

# === Configuration: Set the target directory and search phrases ===
DESTINATION_DIRECTORY = r"C:\Users\md8w7\OneDrive University of Missouri\Desktop\ImportantFiles\Milestone4\backend"
TARGET_PHRASES = ["KeyAmount1","KeyAmount2","KeyAmount3"]  # List of phrases to search for
REPLACEMENT_PHRASES = ["NewKeyAmount1","NewKeyAmount2","NewKeyAmount3"]  # Replacement phrases
EXCLUDED_PHRASES = ["PyScanner", "ID_Replace_Python", "ID_Replace_Python_Final"]  # List of phrases to exclude files from the search

# === New Configuration: Specific targets ===
SPECIFIC = True  # Set this to True to enable specific file matching
SPECIFIC_TARGET_FILES = ["CFA copy.py", "example2.py"]  # List of specific files to search

# === Log file path ===
LOG_FILE_PATH = os.path.join(DESTINATION_DIRECTORY, 'ID_Replace_Python.log')

def initialize_log():
    """Clear previous content and initialize the log file."""
    with open(LOG_FILE_PATH, 'w', encoding='utf-8') as log_file:
        log_file.write(f"=== Search for Phrases {', '.join(TARGET_PHRASES)} ===\n")
        log_file.write(f"Excluding files containing: {', '.join(EXCLUDED_PHRASES)}\n\n")
        if SPECIFIC:
            log_file.write(f"Searching only in specific files: {', '.join(SPECIFIC_TARGET_FILES)}\n\n")

def log_matches(matches, total_files_processed):
    """Write matches and total files processed to the log file in tabular format."""
    summary_header = f"=== Summary of Matches ===\n\n"
    table_header = "| # | Phrase | Replacement | File Path | Line | Content |\n" + \
                   "|---|--------|-------------|-----------|------|---------|\n"

    table_rows = "\n".join(
        f"| {i + 1} | {match['phrase']} | {match['replacement']} | {match['file']} | {match['line']} | {match['content']} |"
        for i, match in enumerate(matches)
    )

    summary_content = table_header + table_rows if matches else "No matches found.\n"
    total_summary = f"\nTotal Files Processed: {total_files_processed}\n"

    with open(LOG_FILE_PATH, 'a', encoding='utf-8') as log_file:
        log_file.write(summary_header + summary_content + total_summary)

def is_excluded_file(filename):
    """Check if a file should be excluded based on its name."""
    return any(excluded in filename for excluded in EXCLUDED_PHRASES)

def is_specific_target(file):
    """Check if the file is in the specific target list."""
    return file in SPECIFIC_TARGET_FILES if SPECIFIC else True

def save_updated_file(file_path, updated_content, change_count):
    """Save the updated file with a new name based on the number of changes."""
    base_name = os.path.basename(file_path).replace(".py", "")
    new_file_name = f"{base_name}_updated_{change_count}.py"
    new_file_path = os.path.join(os.path.dirname(file_path), new_file_name)

    with open(new_file_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    print(f"Updated file saved: {new_file_path}")

def search_and_replace(directory, target_phrases, replacement_phrases):
    """Recursively search and replace phrases in all Python files."""
    patterns = {phrase: re.compile(re.escape(phrase), re.IGNORECASE) 
                for phrase in target_phrases}
    matches = []
    total_files_processed = 0

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py") and not is_excluded_file(file) and is_specific_target(file):
                total_files_processed += 1  # Increment total files processed
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                    
                    updated_lines = lines[:]
                    change_count = 0

                    # Search and replace in each line
                    for i, line in enumerate(lines):
                        for phrase, pattern in patterns.items():
                            if pattern.search(line):
                                replacement = replacement_phrases[target_phrases.index(phrase)]
                                updated_line = pattern.sub(replacement, line)
                                updated_lines[i] = updated_line  # Apply replacement
                                change_count += 1
                                relative_path = os.path.relpath(file_path, directory)

                                # Log the match
                                matches.append({
                                    'phrase': phrase,
                                    'replacement': replacement,
                                    'file': relative_path,
                                    'line': i + 1,
                                    'content': updated_line.strip()
                                })

                    # Save the updated file if changes were made
                    if change_count > 0:
                        updated_content = ''.join(updated_lines)
                        save_updated_file(file_path, updated_content, change_count)

                except Exception as e:
                    print(f"Error reading {file_path}: {e}")

    return matches, total_files_processed

def main():
    """Main function to initialize log, perform search/replace, and log results."""
    initialize_log()
    matches, total_files_processed = search_and_replace(DESTINATION_DIRECTORY, TARGET_PHRASES, REPLACEMENT_PHRASES)
    log_matches(matches, total_files_processed)
    print(f"Search and replace completed. Results are logged in: {LOG_FILE_PATH}")

# Run the main function
if __name__ == "__main__":
    main()
