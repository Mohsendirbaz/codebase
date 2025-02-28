import React, { useState } from 'react';
import AWS from './aws-config';

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState('Input'); // 'Input' or 'Output'

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUploadTypeChange = (event) => {
    setUploadType(event.target.value);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }

    const s3 = new AWS.S3();
    const params = {
      Bucket: 'nf3-ml-dataset',
      Key: `${uploadType}/${selectedFile.name}`,
      Body: selectedFile,
      Metadata: {
        'x-amz-meta-tag': uploadType === 'Input' ? 'Configuration' : 'Results'
      }
    };

    s3.upload(params, (err, data) => {
      if (err) {
        console.error('Error uploading file:', err);
        alert('Error uploading file. Check the console for more details.');
      } else {
        console.log('File uploaded successfully:', data);
        alert('File uploaded successfully.');
      }
    });
  };

  return (
    <div>
      <h3>Upload Dataset</h3>
      <input type="file" onChange={handleFileChange} />
      <select value={uploadType} onChange={handleUploadTypeChange}>
        <option value="Input">Input (Configuration)</option>
        <option value="Output">Output (Results)</option>
      </select>
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
};

export default FileUpload;
