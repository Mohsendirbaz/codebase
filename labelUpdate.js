const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Path configuration
const PROJECT_ROOT = path.resolve(__dirname);
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend', 'Utility_functions');

// Helper function to create incremental backups
const createBackup = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const dirName = path.dirname(filePath);
  const baseName = path.basename(filePath);
  const extension = path.extname(baseName);
  const fileName = baseName.replace(extension, '');

  let backupNumber = 1;
  let backupPath = path.join(dirName, `${fileName}_backup${backupNumber}${extension}`);

  while (fs.existsSync(backupPath)) {
    backupNumber++;
    backupPath = path.join(dirName, `${fileName}_backup${backupNumber}${extension}`);
  }

  fs.copyFileSync(filePath, backupPath);
  console.log(`Created backup at: ${backupPath}`);
  return true;
};

// Enhanced endpoint for partial updates
app.post('/api/update-form-values', (req, res) => {
  try {
    const { updates } = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided'
      });
    }

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

    // 1. Process useFormValues.js
    let useFormValuesContent = fs.readFileSync(useFormValuesPath, 'utf8');

    // Update propertyMapping (only edited labels)
    const propertyMappingRegex = /const propertyMapping = \{[\s\S]*?\};/;
    const propertyMappingMatch = useFormValuesContent.match(propertyMappingRegex);

    if (!propertyMappingMatch) {
      return res.status(500).json({
        success: false,
        message: 'Could not find propertyMapping in useFormValues.js'
      });
    }

    let propertyMappingContent = propertyMappingMatch[0];
    Object.keys(updates).forEach(key => {
      const regex = new RegExp(`"${key}":\\s*"[^"]*"`);
      if (regex.test(propertyMappingContent)) {
        propertyMappingContent = propertyMappingContent.replace(
            regex,
            `"${key}": "${updates[key].label}"`
        );
      } else {
        console.warn(`Key ${key} not found in propertyMapping`);
      }
    });

    // Update defaultValues (only for edited labels)
    const defaultValuesRegex = /const defaultValues = \{[\s\S]*?\};/;
    const defaultValuesMatch = useFormValuesContent.match(defaultValuesRegex);

    if (!defaultValuesMatch) {
      return res.status(500).json({
        success: false,
        message: 'Could not find defaultValues in useFormValues.js'
      });
    }

    let defaultValuesContent = defaultValuesMatch[0];
    Object.keys(updates).forEach(key => {
      const regex = new RegExp(`"${key}":\\s*[^,]+`);
      if (regex.test(defaultValuesContent)) {
        defaultValuesContent = defaultValuesContent.replace(
            regex,
            `"${key}": ${JSON.stringify(updates[key].value)}`
        );
      } else {
        console.warn(`Key ${key} not found in defaultValues`);
      }
    });

    // Apply both updates to the file content
    let updatedContent = useFormValuesContent
        .replace(propertyMappingRegex, propertyMappingContent)
        .replace(defaultValuesRegex, defaultValuesContent);

    fs.writeFileSync(useFormValuesPath, updatedContent, 'utf8');

    // 2. Process common_utils.py (only property_mapping)
    let commonUtilsContent = fs.readFileSync(commonUtilsPath, 'utf8');
    const pythonPropertyMappingRegex = /property_mapping = \{[\s\S]*?\}/;
    const pythonPropertyMappingMatch = commonUtilsContent.match(pythonPropertyMappingRegex);

    if (!pythonPropertyMappingMatch) {
      return res.status(500).json({
        success: false,
        message: 'Could not find property_mapping in common_utils.py'
      });
    }

    let pythonPropertyMappingContent = pythonPropertyMappingMatch[0];
    Object.keys(updates).forEach(key => {
      const regex = new RegExp(`"${key}":\\s*"[^"]*"`);
      if (regex.test(pythonPropertyMappingContent)) {
        pythonPropertyMappingContent = pythonPropertyMappingContent.replace(
            regex,
            `"${key}": "${updates[key].label}"`
        );
      }
    });

    const updatedCommonUtilsContent = commonUtilsContent.replace(
        pythonPropertyMappingRegex,
        pythonPropertyMappingContent
    );

    fs.writeFileSync(commonUtilsPath, updatedCommonUtilsContent, 'utf8');

    res.json({
      success: true,
      message: `Successfully updated ${Object.keys(updates).length} items`,
      updatedItems: Object.keys(updates),
      backups: {
        useFormValues: path.basename(useFormValuesPath) + '_backup',
        commonUtils: path.basename(commonUtilsPath) + '_backup'
      }
    });

  } catch (error) {
    console.error('Error updating form values:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Label Update Service'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = 3060;
app.listen(PORT, () => {
  console.log(`Label Update server running on port ${PORT}`);
  console.log(`Project root: ${PROJECT_ROOT}`);
  console.log(`Source directory: ${SRC_DIR}`);
  console.log(`Backend directory: ${BACKEND_DIR}`);
});

module.exports = app;