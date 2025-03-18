"""
Script to divide a text or markdown file into multiple equal-sized parts.

Usage:
    python divide_markdown.py [--parts N]

Arguments:
    --parts N    Number of parts to divide the file into (default: 9)
"""
import os
import re
import sys
import argparse

def divide_markdown(input_file, output_prefix, num_parts=6):
    """
    Divides a text or markdown file into approximately equal parts,
    attempting to break at paragraph boundaries.
    
    Args:
        input_file (str): Path to the input text or markdown file
        output_prefix (str): Prefix for output files (will be followed by 1, 2, 3, etc.)
        num_parts (int): Number of parts to divide the file into (default: 6)
    
    Returns:
        bool: True if successful, False otherwise
    """
    # Check if file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found.")
        return False
    
    # Validate num_parts
    if num_parts < 1:
        print(f"Error: Number of parts must be at least 1, got {num_parts}")
        return False
        
    try:
        # Read the entire file content
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Get total length
        total_length = len(content)
        print(f"Original file size: {total_length} characters")
        
        # Find paragraph breaks (double newlines)
        paragraph_breaks = [m.start() for m in re.finditer(r'\n\s*\n', content)]
        
        # If only one part requested, just copy the whole file
        if num_parts == 1:
            with open(f"{output_prefix}1.txt", 'w', encoding='utf-8') as f:
                f.write(content.strip())
            print(f"File saved as {output_prefix}1.txt (full content)")
            return True
        
        # Calculate target size for each part
        target_part_size = total_length // num_parts
        
        # If no paragraph breaks or very few, fall back to simple division
        if len(paragraph_breaks) < num_parts - 1:
            parts = []
            for i in range(num_parts):
                start = i * target_part_size
                end = (i + 1) * target_part_size if i < num_parts - 1 else total_length
                parts.append(content[start:end])
        else:
            # Find break points near the division marks
            break_indices = []
            for i in range(1, num_parts):
                target_position = i * target_part_size
                break_idx = find_nearest_break(paragraph_breaks, target_position, content, target_part_size)
                break_indices.append(break_idx)
            
            # Ensure break points are in ascending order
            for i in range(1, len(break_indices)):
                if break_indices[i] <= break_indices[i-1]:
                    # Find the next paragraph break after the previous one
                    for idx in sorted(paragraph_breaks):
                        if idx > break_indices[i-1]:
                            break_indices[i] = idx
                            break
            
            # Split the content
            parts = []
            start_idx = 0
            for break_idx in break_indices:
                parts.append(content[start_idx:break_idx])
                start_idx = break_idx
            parts.append(content[start_idx:])  # Add the last part
        
        # Save the parts
        for i, part in enumerate(parts, 1):
            with open(f"{output_prefix}{i}.txt", 'w', encoding='utf-8') as f:
                f.write(part.strip())
            print(f"Part {i} size: {len(part)} characters")
        
        # Print summary
        part_files = [f"{output_prefix}{i}.txt" for i in range(1, num_parts + 1)]
        print(f"Files saved as {', '.join(part_files)}")
        
        return True
    except Exception as e:
        print(f"Error processing file: {e}")
        return False

def find_nearest_break(breaks, target_position, content, target_part_size):
    """
    Finds the paragraph break closest to the target position.
    
    Args:
        breaks (list): List of paragraph break positions
        target_position (int): Target position in the content
        content (str): The full content string
        target_part_size (int): Target size for each part
        
    Returns:
        int: Position of the nearest paragraph break
    """
    if not breaks:
        return target_position
    
    # Find the break closest to the target position
    closest_break = min(breaks, key=lambda x: abs(x - target_position))
    
    # If we're very close to the target (within 10% of target part size), use it
    if abs(closest_break - target_position) < target_part_size * 0.1:
        return closest_break
    
    # Otherwise, find the first break after the target position
    for break_pos in sorted(breaks):
        if break_pos >= target_position:
            return break_pos
    
    # If no break after target, use the last break
    return breaks[-1]

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Divide a text or markdown file into multiple equal-sized parts.')
    parser.add_argument('--parts', type=int, default=9, help='Number of parts to divide the file into (default: 9)')
    args = parser.parse_args()
    
    # Get the number of parts from command line argument
    num_parts = args.parts
    
    # Look for existing markdown files in the current directory
    current_dir = os.getcwd()
    print(f"Current working directory: {current_dir}")
    
    # Try to find "csl.md" first
    input_file = os.path.join(current_dir, "csl.md")
    
    # If "csl.md" doesn't exist, look for "eslint plugin edge cases.md"
    if not os.path.exists(input_file):
        print(f"File '{input_file}' not found.")
        input_file = os.path.join(current_dir, "eslint plugin edge cases.md")
        print(f"Trying alternative file: '{input_file}'")
    
    output_prefix = "part"  # Will create part1.txt, part2.txt, part3.txt, etc.
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: No suitable markdown files found.")
        sys.exit(1)
    else:
        print(f"Processing file: {input_file}")
        print(f"Dividing into {num_parts} parts")
        success = divide_markdown(input_file, output_prefix, num_parts)
        
        if success:
            part_files = [f"{output_prefix}{i}.txt" for i in range(1, num_parts + 1)]
            print(f"Files successfully saved as {', '.join(part_files)}")
        else:
            print("Failed to process the markdown file.")