import { useState } from 'react';
import { apiService } from '../services';

export const useAnalysis = ({ version, selectedVersions, V, F, S }) => {
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [selectedCalculationOption, setSelectedCalculationOption] = useState('freeFlowNPV');
  const [targetRow, setTargetRow] = useState('20');
  const [calculatedPrices, setCalculatedPrices] = useState({});

  const handleOptionChange = (event) => {
    setSelectedCalculationOption(event.target.value);
  };

  const handleTargetRowChange = (event) => {
    setTargetRow(event.target.value);
  };

  const updatePrice = (version, price) => {
    setCalculatedPrices((prevPrices) => ({
      ...prevPrices,
      [version]: price,
    }));
  };

  const handleRun = async () => {
    setAnalysisRunning(true);
    setCalculatedPrices({});

    try {
      const response = await fetch(apiService.endpoints.run, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedVersions,
          selectedV: V,
          selectedF: F,
          selectedCalculationOption,
          targetRow,
          SenParameters: S,
        }),
      });

      if (selectedCalculationOption === 'calculateForPrice') {
        selectedVersions.forEach((version) => {
          const eventSource = apiService.createEventSource(
            apiService.endpoints.streamPrice(version)
          );

          eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(`Streamed Price for version ${version}:`, data.price);
            updatePrice(version, data.price);

            if (data.complete) {
              console.log(`Completed streaming for version ${version}`);
              eventSource.close();
            }
          };

          eventSource.onerror = (error) => {
            apiService.handleStreamError(error, eventSource);
          };
        });
      } else {
        const result = await response.json();
        if (response.ok) {
          console.log(result.message);
        } else {
          console.error(result.error);
        }
      }
    } catch (error) {
      console.error('Error during analysis:', error);
    } finally {
      setAnalysisRunning(false);
    }
  };

  const handleRunPNG = async ({ selectedProperties, remarks, customizedFeatures }) => {
    setAnalysisRunning(true);
    try {
      const versions = selectedVersions.length > 0 ? selectedVersions : [version];
      
      if (!versions.includes(version)) {
        versions.push(version);
      }

      const response = await fetch(apiService.endpoints.generatePngPlots, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedVersions: versions,
          selectedProperties: selectedProperties || [],
          remarks,
          customizedFeatures,
          S: {}
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const plotsTab = document.querySelector('button.tab-button:nth-child(4)');
      if (plotsTab) {
        plotsTab.click();
      }
    } catch (error) {
      console.error('Error during PNG generation:', error);
    } finally {
      setAnalysisRunning(false);
    }
  };

  const handleRunSub = async ({ selectedVersions, selectedProperties, remarks, customizedFeatures }) => {
    setAnalysisRunning(true);
    try {
      const response = await fetch(apiService.endpoints.runSub, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedVersions,
          selectedProperties,
          remarks,
          customizedFeatures,
          selectedV: V,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error during analysis:', error);
    } finally {
      setAnalysisRunning(false);
    }
  };

  return {
    analysisRunning,
    selectedCalculationOption,
    targetRow,
    calculatedPrices,
    handleOptionChange,
    handleTargetRowChange,
    handleRun,
    handleRunPNG,
    handleRunSub,
  };
};

export default useAnalysis;
