# Git Command Reference Guide

## Repository Status Commands
```bash
# Show current branch and modified files
git status

# Show current commit hash
git rev-parse HEAD

# List all configured remotes and their URLs
git remote -v
```

## Branch Management
```bash
# List all local branches (* marks current branch)
git branch

# List all branches including remote branches
git branch -a

# Create and switch to new branch
git checkout -b SConfig.R1

# Switch to existing branch
git checkout recovered-CSS

# Fetch updates from all remotes without merging
git fetch --all
```

## Working with Multiple Remotes
```bash
# Check out branch from specific remote
git checkout -b recovered-CSS SF/recovered-CSS

# Check out branch from codebase remote
git checkout -b Sconfig.R1 codebase/Sconfig.R1

# Pull latest changes from SF remote
git checkout recovered-CSS
git pull SF recovered-CSS

# Pull latest changes from codebase remote
git checkout Sconfig.R1
git pull codebase Sconfig.R1
```

## Committing and Pushing Changes
```bash
# Stage all changes
git add .

# Commit staged changes with message
git commit -m "well positioned efficacy box and senistivity vertically stacked, with minor vibrations when hovering outside box"

# Push to SF remote
git push SF recovered-CSS

# Push to codebase remote
git push codebase SConfig.R1
```

## Repository Cloning Scripts

### Fetch SF Repository
```bash
# Remove existing temp directory if needed
# rm -rf temp_SF

# Create directory for the output
mkdir -p src.fetched

# Clone specific branch with minimal history
git clone -b SF.R1 --depth 1 https://github.com/Mohsendirbaz/SF.git temp_SF

# Copy only the src directory to destination
cp -r temp_SF/src/* src.fetched/

# Remove the temporary repository
rm -rf temp_SF
```

### Fetch TeaSpace Repository
```bash
# Create directory for the output
mkdir -p src.sketch.series

# Clone specific branch with minimal history
git clone -b blueprint-sketch-update1 --depth 1 https://github.com/Mohsendirbaz/TeaSpace.git temp_TeaSpace

# Copy only the src directory to destination
cp -r temp_TeaSpace/src/* src.sketch.series/

# Remove the temporary repository
rm -rf temp_TeaSpace
```

## Configuration Management

### Python Script Arguments
```python
# Command line argument handling
version = sys.argv[1] if len(sys.argv) > 1 else 1
selected_v = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {"V1": "off", "V2": "off", "V3": "off", "V4": "off", "V5": "off", "V6": "off", "V7": "off", "V8": "off", "V9": "off", "V10": "off"}
selected_f = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {"F1": "off", "F2": "off", "F3": "off", "F4": "off", "F5": "off"}
target_row = int(sys.argv[4]) if len(sys.argv) > 4 else 10
selected_calculation_option = sys.argv[5] if len(sys.argv) > 5 else 'calculateforprice'  # Default to calculateforprice
```

### Example Python Script Execution
```bash
# Run configuration update script with all parameters
python update_config_modules_with_CFA_7.py "1" '{"V1": "off", "V2": "off", "V3": "off", "V4": "off", "V5": "off", "V6": "off", "V7": "off", "V8": "off", "V9": "off", "V10": "off"}' '{"F1": "off", "F2": "off", "F3": "off", "F4": "off", "F5": "off"}' "10" "calculateforprice"
```
