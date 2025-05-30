const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(bodyParser.text({ type: '*/*' })); // Use text parser for all content types
app.use(cors());

const NF3_ML_DIR = path.join(__dirname);

// Function to check write permissions
const checkWritePermissions = (dir) => {
  fs.access(dir, fs.constants.W_OK, (err) => {
    if (err) {
      console.error(`No write permission for directory: ${dir}`);
    } else {
      console.log(`Write permission granted for directory: ${dir}`);
    }
  });
};

// Check permissions for the directory at startup
checkWritePermissions(NF3_ML_DIR);

app.post('/append/:version', (req, res) => {
  const version = req.params.version;
  const filePath = path.join(NF3_ML_DIR, `Original/Batch(${version})/ConfigurationPlotSpec(${version})/U_configurations(${version}).py`);

  console.log(`Received request to append version: ${version}`);
  console.log(`File path: ${filePath}`);

  // Ensure the directory structure exists
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  } catch (err) {
    console.error(`Error creating directories:`, err);
    return res.status(500).send('Error creating directories');
  }

  // Get the content from the request body
  const content = req.body;
  console.log(`Content to append: ${content}`);

  // Read the existing file content
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File doesn't exist, create it and add a blank line before appending content
        const newContent = `\n${content}`;
        fs.writeFile(filePath, newContent, 'utf8', (writeErr) => {
          if (writeErr) {
            console.error(`Error writing to file at ${filePath}:`, writeErr);
            return res.status(500).send('Error writing to file in nf3-ml');
          }
          res.send('File created and content appended as the second line successfully');
        });
      } else {
        console.error(`Error reading file at ${filePath}:`, err);
        return res.status(500).send('Error reading file');
      }
    } else {
      if (data.trim() === '') {
        // File is empty, append content as the second line
        const newContent = `\n${content}`;
        fs.appendFile(filePath, newContent, 'utf8', (appendErr) => {
          if (appendErr) {
            console.error(`Error appending to file at ${filePath}:`, appendErr);
            return res.status(500).send('Error appending to file in nf3-ml');
          }
          res.send('Content appended as the second line successfully');
        });
      } else {
        // File is not empty, just append content as usual
        fs.appendFile(filePath, `\n${content}`, 'utf8', (appendErr) => {
          if (appendErr) {
            console.error(`Error appending to file at ${filePath}:`, appendErr);
            return res.status(500).send('Error appending to file in nf3-ml');
          }
          res.send('Content appended successfully');
        });
      }
    }
  });
});

app.listen(3040, () => {
  console.log('Append server running on port 3040');
});
