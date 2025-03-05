const fs = require('fs');
const path = require('path');

// The suspected symlink location
const symlinkPath = path.join(__dirname, 'public', 'Original');

try {
  // Check if the path exists
  const stats = fs.lstatSync(symlinkPath);
  
  // If it's a symlink, remove it
  if (stats.isSymbolicLink()) {
    console.log('Found symlink at:', symlinkPath);
    fs.unlinkSync(symlinkPath);
    console.log('Removed symlink');
  } else {
    console.log('Path exists but is not a symlink:', symlinkPath);
  }
} catch (error) {
  // If path doesn't exist
  if (error.code === 'ENOENT') {
    console.log('Path does not exist:', symlinkPath);
  } else {
    console.error('Error:', error.message);
  }
}

// Create the actual directory
try {
  fs.mkdirSync(symlinkPath, { recursive: true });
  console.log('Created directory:', symlinkPath);
  
  // Create a gitkeep file to ensure directory is tracked
  fs.writeFileSync(path.join(symlinkPath, '.gitkeep'), '');
  console.log('Added .gitkeep file');
} catch (error) {
  console.error('Error creating directory:', error.message);
}