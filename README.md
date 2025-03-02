# VS Code Restore Permission Fix

This repository contains tools and documentation to help resolve permission issues when using VS Code's restore feature.

## Quick Start

If you're experiencing "Permission denied" errors when using VS Code's restore feature, you have several options:

### Option 1: Run the Batch Script (Recommended for most users)

1. Right-click on `fix_permissions.bat`
2. Select "Run as administrator"
3. Follow the prompts

### Option 2: Run the PowerShell Script (For PowerShell users)

1. Right-click on `Fix-VSCodePermissions.ps1`
2. Select "Run with PowerShell as administrator"
3. Follow the prompts

### Option 3: Manual Solutions

For detailed instructions on all available solutions, including manual approaches, see the comprehensive guide:

- [VSCode_Restore_Permission_Fix.md](./VSCode_Restore_Permission_Fix.md)

## Files Included

- `fix_permissions.bat` - Batch script to automate permission fixes
- `Fix-VSCodePermissions.ps1` - PowerShell script with enhanced error handling
- `VSCode_Restore_Permission_Fix.md` - Comprehensive guide with multiple solutions
- `README.md` - This file

## After Running the Scripts

After running either script:

1. Close all instances of VS Code
2. Reopen VS Code as Administrator
3. Try the restore operation again

If you continue to experience issues, refer to the comprehensive guide for additional solutions.