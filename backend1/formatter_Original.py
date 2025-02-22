import os
import sys
import re

UPLOAD_DIR = r"C:\Users\md8w7\OneDrive University of Missouri\Desktop\ImportantFiles\Milestone4\backend\Original"

def check_write_permissions(directory):
    try:
        if os.access(directory, os.W_OK):
            print(f"Write permission granted for directory: {directory}")
        else:
            print(f"No write permission for directory: {directory}")
    except Exception as e:
        print(f"Error checking permissions for {directory}: {e}")

# Check permissions for the directory
check_write_permissions(UPLOAD_DIR)

def format_value(value, quote=True):
    """Helper function to ensure that value is formatted correctly"""
    if quote:
        return f'"{value.strip()}"'  # Always add double quotes around the value if required
    else:
        return value  # Return as is (for numeric values in vectors)

def medieval_parse_and_sanitize(content):
    sanitized_lines = []
    filtered_values_json = []

    # Initialize vectors for special IDs
    variable_costsAmount4 = [None] * 11
    amounts_per_unitAmount5 = [None] * 11
    
    # Extract filteredValues
    filtered_values_start = content.find('"filteredValues":[')
    if filtered_values_start != -1:
        filtered_values_start += len('"filteredValues":[')
        filtered_values_end = content.find(']', filtered_values_start)
        filtered_values_content = content[filtered_values_start:filtered_values_end]
        
        # Process each item in filteredValues
        while True:
            id_start = filtered_values_content.find('"id":"')
            if id_start == -1:
                break
            id_start += len('"id":"')
            id_end = filtered_values_content.find('"', id_start)
            id_value = filtered_values_content[id_start:id_end]
            
            value_start = filtered_values_content.find('"value":', id_end)
            if value_start == -1:
                break
            value_start += len('"value":')
            value_end = filtered_values_content.find(',', value_start)
            if filtered_values_content[value_start] == '"':
                value_end = filtered_values_content.find('"', value_start + 1) + 1
                value_value = filtered_values_content[value_start:value_end]
            else:
                value_end = filtered_values_content.find(',', value_start)
                if value_end == -1:
                    value_end = filtered_values_content.find('}', value_start)
                value_value = filtered_values_content[value_start:value_end]

            # Enforce the correct format right after extraction
            if id_value == "use_direct_operating_expensesAmount1":
                # Convert "True"/"False" to boolean True/False without quotes
                if value_value == '"True"':
                    value_value = "True"
                elif value_value == '"False"':
                    value_value = "False"
            elif "Amount4" in id_value or "Amount5" in id_value:
                # Keep these values unquoted for vector entries
                value_value = value_value.strip()
            else:
                # Enclose string values in single quotes for other IDs
                if value_value.startswith('"') and value_value.endswith('"'):
                    value_value = f"'{value_value[1:-1]}'"
            
            # Strip any surrounding whitespace from value_value
            stripped_value = value_value.strip()

            # Convert to numeric if possible
            if stripped_value.isdigit():
                stripped_value = int(stripped_value)
            else:
                try:
                    stripped_value = float(stripped_value)
                except ValueError:
                    pass  # If conversion fails, keep the value as a string

            # Assign values to the vectors if the ID matches
            if "Amount4" in id_value:
                for i in range(len(variable_costsAmount4)):
                    if variable_costsAmount4[i] is None:
                        variable_costsAmount4[i] = stripped_value
                        break
            elif "Amount5" in id_value:
                for i in range(len(amounts_per_unitAmount5)):
                    if amounts_per_unitAmount5[i] is None:
                        amounts_per_unitAmount5[i] = stripped_value
                        break

            # Append the sanitized line (keep numeric values unquoted for Amount4 and Amount5)
            if "Amount4" in id_value or "Amount5" in id_value:
                sanitized_lines.append(f'{id_value}={stripped_value}')  # No quotes for numeric values
            else:
                sanitized_lines.append(f'{id_value}={value_value}')

            filtered_values_content = filtered_values_content[value_end:]
    
    # Collect individual filteredValue entries
    content_lines = content.splitlines()
    for line in content_lines:
        if '"filteredValue":{' in line:
            # Extract start, end, id, value, remarks using regex
            start_match = re.search(r'"start":\s*([^,]+)', line)
            end_match = re.search(r'"end":\s*([^,]+)', line)
            value_match = re.search(r'"value":\s*([^,]+)', line)
            id_match = re.search(r'"id":"([^"]+)"', line)
            remarks_match = re.search(r'"remarks":"([^"]+)"', line)

            # Format and construct the new filteredValue line
            formatted_value = format_value(value_match.group(1)) if value_match else ''
            formatted_start = f'"{start_match.group(1)}"' if start_match else ''
            formatted_end = f'"{end_match.group(1)}"' if end_match else ''
            formatted_id = id_match.group(1) if id_match else ''
            formatted_remarks = remarks_match.group(1) if remarks_match else ''

            filtered_value_line = f'{{"filteredValue":{{"id":"{formatted_id}","value":{formatted_value},"start":{formatted_start},"end":{formatted_end},"remarks":"{formatted_remarks}"}}}}'
            filtered_values_json.append(filtered_value_line.strip())

    # Add the populated vectors to the sanitized lines
    sanitized_lines.append(f"variable_costsAmount4={variable_costsAmount4}")
    sanitized_lines.append(f"amounts_per_unitAmount5={amounts_per_unitAmount5}")
    
    return '\n'.join(sanitized_lines), filtered_values_json

def sanitize_file(version):
    original_file_path = os.path.join(UPLOAD_DIR, f'Batch({version})/ConfigurationPlotSpec({version})/U_configurations({version}).py')
    sanitized_file_path = os.path.join(UPLOAD_DIR, f'Batch({version})/ConfigurationPlotSpec({version})/configurations({version}).py')

    print(f"Sanitizing file for version: {version}")
    print(f"Original file path: {original_file_path}")
    print(f"Sanitized file path: {sanitized_file_path}")

    # Ensure the directory structure exists
    try:
        os.makedirs(os.path.dirname(original_file_path), exist_ok=True)
    except Exception as e:
        print(f"Error creating directories: {e}")
        return {"error": "Error creating directories"}

    # Read content from the original file
    try:
        with open(original_file_path, 'r', encoding='utf-8') as f:
            raw_content = f.read()
        print(f"Raw content read from file: {raw_content}")
    except Exception as e:
        print(f"Error reading from original file at {original_file_path}: {e}")
        return {"error": "Error reading from original file"}

    # Parse and sanitize the content
    sanitized_content, filtered_values_json = medieval_parse_and_sanitize(raw_content)
    print(f"Sanitized content: {sanitized_content}")
    print(f"Filtered values JSON: {filtered_values_json}")

    # Write sanitized content to the new file
    try:
        with open(sanitized_file_path, 'w', encoding='utf-8') as f:
            f.write(sanitized_content)
            f.write("\n\nfiltered_values_json=[\n")
            for entry in filtered_values_json:
                f.write(f"   '{entry}',\n")
            f.write("]\n")
        print("Sanitized file written successfully")
        return {"message": "Sanitized file written successfully"}
    except Exception as e:
        print(f"Error writing to sanitized file at {sanitized_file_path}: {e}")
        return {"error": "Error writing to sanitized file"}

if __name__ == '__main__':
    # Example usage: sanitize the configuration file for version "7"
    version = sys.argv[1] if len(sys.argv) > 1 else 1
    sanitize_file(version)
