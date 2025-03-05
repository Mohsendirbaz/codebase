import React, { useState } from 'react';
import AWS from './aws-config';
import './AWSFileUpload.css';

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState('Input'); // 'Input' or 'Output'
  const [uploadStatus, setUploadStatus] = useState('');

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

    console.log('Uploading file:', selectedFile.name);
    console.log('Using bucket name:', process.env.REACT_APP_S3_BUCKET_NAME);

    const s3 = new AWS.S3();
    const params = {
      Bucket: process.env.REACT_APP_S3_BUCKET_NAME,
      Key: `${uploadType}/${selectedFile.name}`,
      Body: selectedFile,
      Metadata: {
        'x-amz-meta-tag': uploadType === 'Input' ? 'Configuration' : 'Results'
      }
    };

    setUploadStatus('Uploading...');

    s3.upload(params, (err, data) => {
      if (err) {
        console.error('Error uploading file:', err);
        setUploadStatus('Error uploading file. Check the console for more details.');
        alert('Error uploading file. Check the console for more details.');
      } else {
        console.log('File uploaded successfully:', data);
        setUploadStatus('File uploaded successfully.');
        alert('File uploaded successfully.');
      }
    });
  };

  return (
    <div className="upload-container">
      <h3>Upload Dataset</h3>
      <input type="file" onChange={handleFileChange} />
      <select value={uploadType} onChange={handleUploadTypeChange}>
        <option value="Input">Input (Configuration)</option>
        <option value="Output">Output (Results)</option>
      </select>
      <button onClick={handleUpload}>Upload</button>
      {uploadStatus && <div className="upload-status">{uploadStatus}</div>}
    </div>
  );
};

export default FileUpload;
