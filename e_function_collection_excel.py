"""Function analyzer for Python files with usage tracking and documentation extraction"""
import os
import ast
import sys
from typing import Dict, List
from collections import defaultdict
import pandas as pd
import importlib.util

def extract_function_info(file_path: str) -> List[Dict]:
    """Extract function definitions and their docstrings from Python file"""
    functions = []
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            tree = ast.parse(file.read())
            
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                docstring = ast.get_docstring(node) or "No description available"
                functions.append({
                    'name': node.name,
                    'file': os.path.basename(file_path),
                    'path': file_path,
                    'description': docstring.split('\n')[0],
                    'arguments': [arg.arg for arg in node.args.args],
                    'line_number': node.lineno
                })
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
    return functions

def analyze_function_usage(directory: str) -> pd.DataFrame:
    """Analyze function definitions and usage across Python files"""
    all_functions = []
    usage_count = defaultdict(int)
    
    # Walk through directory for Python files
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                
                # Extract function definitions
                functions = extract_function_info(file_path)
                all_functions.extend(functions)
                
                # Count function usage
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        for func in all_functions:
                            usage_count[func['name']] += content.count(func['name'])
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")

    # Create DataFrame with function information
    df = pd.DataFrame(all_functions)
    if not df.empty:
        df['usage_count'] = df['name'].map(usage_count)
        df = df[['name', 'usage_count', 'file', 'path', 'description', 'line_number']]
        df = df.sort_values('usage_count', ascending=False)
    
    return df

def main():
    # Use the current directory or backend subdirectory if it exists
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if os.path.exists(os.path.join(script_dir, "backend")):
        upload_dir = os.path.join(script_dir, "backend")
    else:
        upload_dir = script_dir
    
    print("Analyzing Python functions...")
    df = analyze_function_usage(upload_dir)
    
    # Base filename for output
    base_filename = "e_function_collection"
    
    # Try to save as Excel first
    output_excel = os.path.join(upload_dir, f"{base_filename}.xlsx")
    output_csv = os.path.join(upload_dir, f"{base_filename}.csv")
    
    # Check if openpyxl is available
    has_openpyxl = importlib.util.find_spec("openpyxl") is not None
    
    if has_openpyxl:
        try:
            df.to_excel(output_excel, index=False)
            print(f"\nAnalysis complete. Results saved to: {output_excel}")
        except Exception as e:
            print(f"\nError saving to Excel: {e}")
            print("Falling back to CSV format...")
            df.to_csv(output_csv, index=False)
            print(f"Results saved to: {output_csv}")
    else:
        print("\nWARNING: openpyxl package is not installed. Cannot save as Excel file.")
        print("To install openpyxl, run: pip install openpyxl")
        print("Saving as CSV file instead...")
        df.to_csv(output_csv, index=False)
        print(f"Results saved to: {output_csv}")
    
    # Display summary
    print(f"\nTotal functions found: {len(df)}")
    print("\nTop 10 most used functions:")
    print(df.head(10)[['name', 'usage_count', 'file']].to_string())

if __name__ == "__main__":
    main()