export const batchService = {
  async createNewBatch() {
    try {
      const response = await fetch('http://127.0.0.1:8001/create_new_batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('New Batch Number:', result.NewBatchNumber);
      return result;
    } catch (error) {
      console.error('Batch creation failed:', error);
      throw error;
    }
  },

  async removeBatch(version) {
    try {
      const response = await fetch('http://127.0.0.1:7001/Remove_batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ version }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error during batch removal:', error);
      throw error;
    }
  },

  async submitCompleteSet(version, filteredValues) {
    try {
      const response = await fetch(`http://127.0.0.1:3052/append/${version}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filteredValues }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error during parameter submission:', error);
      throw error;
    }
  },

  async checkAndCreateUploads() {
    try {
      const response = await fetch('http://127.0.0.1:8007/check_and_create_uploads', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  }
};

export default batchService;
