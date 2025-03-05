export const configService = {
  async loadConfiguration(version) {
    try {
      const response = await fetch('http://localhost:5000/load_configuration', {
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
      console.error('Error loading configuration:', error);
      throw error;
    }
  },

  processConfigValues(filteredValues) {
    const processedValues = {};
    
    filteredValues.forEach((item) => {
      let { id, value, remarks } = item;
      if (typeof value === 'string') {
        value = value.trim().replace(/^"|"$/g, '');
        value = isNaN(value) ? value : parseFloat(value);
      }

      processedValues[id] = {
        value: typeof value === 'number' ? value : '',
        remarks: remarks !== undefined ? remarks : '',
      };
    });

    return processedValues;
  },

  transformFormValues(formValues) {
    const formItems = Object.keys(formValues)
      .filter((key) =>
        ['Amount1', 'Amount2', 'Amount3', 'Amount4', 'Amount5', 'Amount6'].some((amt) =>
          key.includes(amt)
        )
      )
      .map((key) => ({
        id: key,
        ...formValues[key],
      }));

    return formItems.map((item) => {
      const efficacyPeriod = formValues[item.id].efficacyPeriod || {};
      return {
        id: item.id,
        value: item.value,
        senParam: item.senParam,
        lifeStage: efficacyPeriod.lifeStage?.value,
        duration: efficacyPeriod.duration?.value,
        remarks: item.remarks || '',
      };
    });
  }
};

export default configService;
