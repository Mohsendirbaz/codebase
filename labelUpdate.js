const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Path to the project root, relative paths from there
const PROJECT_ROOT = path.resolve(__dirname);
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend', 'Utility_functions');

// Helper function to create a backup with incremented number
const createBackup = (filePath) => {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const dirName = path.dirname(filePath);
  const baseName = path.basename(filePath);
  const extension = path.extname(baseName);
  const fileName = baseName.replace(extension, '');

  // Find the next available backup number
  let backupNumber = 1;
  let backupPath = path.join(dirName, `${fileName}_backup${backupNumber}${extension}`);
  
  while (fs.existsSync(backupPath)) {
    backupNumber++;
    backupPath = path.join(dirName, `${fileName}_backup${backupNumber}${extension}`);
  }

  // Create the backup
  fs.copyFileSync(filePath, backupPath);
  console.log(`Created backup at: ${backupPath}`);
  return true;
};

// API endpoint to update form labels in both files
app.post('/api/update-form-labels', (req, res) => {
  try {
    const { labels } = req.body;
    
    if (!labels || Object.keys(labels).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No labels provided'
      });
    }

    // Path to the files we need to update
    const useFormValuesPath = path.join(SRC_DIR, 'useFormValues.js');
    const commonUtilsPath = path.join(BACKEND_DIR, 'common_utils.py');

    // Create backups first
    const useFormValuesBackupSuccess = createBackup(useFormValuesPath);
    const commonUtilsBackupSuccess = createBackup(commonUtilsPath);

    if (!useFormValuesBackupSuccess || !commonUtilsBackupSuccess) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create backups. One or more files not found.'
      });
    }

    // 1. Update useFormValues.js
    let useFormValuesContent = fs.readFileSync(useFormValuesPath, 'utf8');
    
    // Find the propertyMapping object in useFormValues.js
    const propertyMappingRegex = /const propertyMapping = \{[\s\S]*?\};/;
    const propertyMappingMatch = useFormValuesContent.match(propertyMappingRegex);
    
    if (!propertyMappingMatch) {
      return res.status(500).json({
        success: false,
        message: 'Could not find propertyMapping in useFormValues.js'
      });
    }
    
    // Build the new propertyMapping object
    let newPropertyMapping = 'const propertyMapping = {\n';
    
    Object.entries(labels).forEach(([key, label]) => {
      newPropertyMapping += `  "${key}": "${label}",\n`;
    });
    
    newPropertyMapping += '};';
    
    // Replace the old propertyMapping with the new one
    const updatedUseFormValuesContent = useFormValuesContent.replace(
      propertyMappingRegex,
      newPropertyMapping
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(useFormValuesPath, updatedUseFormValuesContent, 'utf8');

    // 2. Update common_utils.py
    let commonUtilsContent = fs.readFileSync(commonUtilsPath, 'utf8');
    
    // Find the property_mapping dictionary in common_utils.py
    const pythonPropertyMappingRegex = /property_mapping = \{[\s\S]*?\}/;
    const pythonPropertyMappingMatch = commonUtilsContent.match(pythonPropertyMappingRegex);
    
    if (!pythonPropertyMappingMatch) {
      return res.status(500).json({
        success: false,
        message: 'Could not find property_mapping in common_utils.py'
      });
    }
    
    // Build the new property_mapping dictionary for Python
    let newPythonPropertyMapping = 'property_mapping = {\n';
    
    Object.entries(labels).forEach(([key, label]) => {
      newPythonPropertyMapping += `    "${key}": "${label}",\n`;
    });
    
    newPythonPropertyMapping += '}';
    
    // Replace the old property_mapping with the new one
    const updatedCommonUtilsContent = commonUtilsContent.replace(
      pythonPropertyMappingRegex,
      newPythonPropertyMapping
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(commonUtilsPath, updatedCommonUtilsContent, 'utf8');

    // Return success
    res.json({
      success: true,
      message: 'Successfully updated form labels in both files',
      backups: {
        useFormValues: `${path.basename(useFormValuesPath)}_backup`,
        commonUtils: `${path.basename(commonUtilsPath)}_backup`
      }
    });

  } catch (error) {
    console.error('Error updating labels:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.listen(3060, () => {
  console.log('Label Update server running on port 3060');
});
