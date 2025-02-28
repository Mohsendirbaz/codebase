import AWS from 'aws-sdk';

// Configure the AWS SDK with your credentials and region using environment variables
AWS.config.update({
  region: 'us-east-1', // Change to your region
  credentials: new AWS.Credentials({
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
  })
});

export default AWS;
