import React, { useState, useCallback, useEffect } from 'react';
import './CFAConsolidationUI.css';
import SelectionPanel from './SelectionPanel';
import ProcessingPanel from './ProcessingPanel';
import ResultsPanel from './ResultsPanel';

const CFAConsolidationUI = () => {
  // State management with proper initialization
  const [selectionState, setSelectionState] = useState({
    available: [],
    selected: [],
    filtered: [],
    searchQuery: '',
    error: null,
    loading: false
  });

  const [processingState, setProcessingState] = useState({
    status: 'idle',
    progress: 0,
    messages: [],
    error: null
  });

  const [resultsState, setResultsState] = useState({
    data: null,
    selectedCell: null,
    inspectorVisible: false,
    inspectorPosition: { x: 0, y: 0 },
    cellDetails: null
  });

  // Load available versions on mount
  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    // Set loading state to provide feedback
    setSelectionState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));
    
    try {
      const response = await fetch('http://localhost:456/api/versions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle case where no versions are returned
      if (!data.versions || data.versions.length === 0) {
        setSelectionState(prev => ({
          ...prev,
          loading: false,
          available: [],
          filtered: [],
          error: 'No CFA versions found. Please check the server configuration.'
        }));
        return;
      }
      
      setSelectionState(prev => ({
        ...prev,
        loading: false,
        available: data.versions,
        filtered: data.versions,
        error: null
      }));
    } catch (error) {
      console.error('Failed to load CFA versions:', error);
      setSelectionState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load versions. Please try again.'
      }));
    }
  };

  // Selection handlers
  const handleVersionSelect = useCallback((version) => {
    setSelectionState(prev => ({
      ...prev,
      selected: prev.selected.includes(version)
        ? prev.selected.filter(v => v !== version)
        : [...prev.selected, version]
    }));
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectionState(prev => ({
      ...prev,
      selected: prev.filtered.length > 0 ? [...prev.filtered] : [...prev.available]
    }));
  }, []);

  const handleSelectNone = useCallback(() => {
    setSelectionState(prev => ({
      ...prev,
      selected: []
    }));
  }, []);

  const handleSearch = useCallback((query) => {
    setSelectionState(prev => ({
      ...prev,
      searchQuery: query,
      filtered: prev.available.filter(version => 
        version.toLowerCase().includes(query.toLowerCase())
      )
    }));
  }, []);

  // Processing handlers
  const startProcessing = useCallback(async () => {
    if (selectionState.selected.length === 0) return;
    
    setProcessingState({
      status: 'processing',
      progress: 0,
      messages: ['Starting consolidation...'],
      error: null
    });
    
    try {
      // Initial consolidation request
      const consolidationResponse = await fetch('http://localhost:456/api/consolidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          versions: selectionState.selected
        })
      });
      
      if (!consolidationResponse.ok) {
        throw new Error(`Consolidation failed! Status: ${consolidationResponse.status}`);
      }
      
      const consolidationId = await consolidationResponse.json();
      
      // Poll for progress
      let completed = false;
      while (!completed) {
        const progressResponse = await fetch(`http://localhost:456/api/consolidate/status/${consolidationId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!progressResponse.ok) {
          throw new Error(`Failed to fetch progress! Status: ${progressResponse.status}`);
        }
        
        const progressData = await progressResponse.json();
        setProcessingState(prev => ({
          ...prev,
          progress: progressData.progress,
          messages: [...prev.messages, progressData.message]
        }));
        
        if (progressData.status === 'complete') {
          completed = true;
          
          // Fetch final results
          const resultsResponse = await fetch(`http://localhost:456/api/consolidate/results/${consolidationId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!resultsResponse.ok) {
            throw new Error(`Failed to fetch results! Status: ${resultsResponse.status}`);
          }
          
          const resultsData = await resultsResponse.json();
          setResultsState(prev => ({
            ...prev,
            data: {
              years: resultsData.years,
              columns: resultsData.columns,
              values: resultsData.values
            }
          }));
          
          setProcessingState(prev => ({
            ...prev,
            status: 'complete',
            messages: [...prev.messages, 'Consolidation complete']
          }));
        } else if (progressData.status === 'error') {
          throw new Error(progressData.error || 'Consolidation failed');
        } else {
          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingState(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
        messages: [...prev.messages, `Error: ${error.message}`]
      }));
    }
  }, [selectionState.selected]);

  const cancelProcessing = useCallback(() => {
    setProcessingState({
      status: 'idle',
      progress: 0,
      messages: [],
      error: null
    });
  }, []);

  // Results handlers
  const handleCellClick = useCallback(async (cell, event) => {
    setResultsState(prev => ({
      ...prev,
      selectedCell: cell,
      inspectorVisible: true,
      inspectorPosition: {
        x: event.clientX,
        y: event.clientY
      },
      cellDetails: null // Reset details while loading
    }));
    
    try {
      const response = await fetch(`http://localhost:456/api/cell-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          year: cell.year,
          column: cell.column,
          rowIndex: cell.rowIndex,
          colIndex: cell.colIndex
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cell details! Status: ${response.status}`);
      }
      
      const detailsData = await response.json();
      setResultsState(prev => ({
        ...prev,
        cellDetails: detailsData
      }));
    } catch (error) {
      console.error('Failed to fetch cell details:', error);
      setResultsState(prev => ({
        ...prev,
        cellDetails: { error: error.message }
      }));
    }
  }, []);

  const closeInspector = useCallback(() => {
    setResultsState(prev => ({
      ...prev,
      inspectorVisible: false,
      selectedCell: null,
      cellDetails: null
    }));
  }, []);

  return (
    <div className="cfa-consolidation">
      <div className="cfa-consolidation__selection-processing">
        <SelectionPanel
          available={selectionState.available}
          selected={selectionState.selected}
          filtered={selectionState.filtered}
          searchQuery={selectionState.searchQuery}
          error={selectionState.error}
          loading={selectionState.loading}
          onSelect={handleVersionSelect}
          onSelectAll={handleSelectAll}
          onSelectNone={handleSelectNone}
          onSearch={handleSearch}
          onRefresh={loadVersions}
        />
        
        <ProcessingPanel
          status={processingState.status}
          progress={processingState.progress}
          messages={processingState.messages}
          error={processingState.error}
          onStart={startProcessing}
          onCancel={cancelProcessing}
          disabled={selectionState.selected.length === 0 || processingState.status === 'processing'}
        />
      </div>

      {resultsState.data && (
        <ResultsPanel
          data={resultsState.data}
          selectedCell={resultsState.selectedCell}
          inspectorVisible={resultsState.inspectorVisible}
          inspectorPosition={resultsState.inspectorPosition}
          cellDetails={resultsState.cellDetails}
          onCellClick={handleCellClick}
          onCloseInspector={closeInspector}
        />
      )}
    </div>
  );
};

export default CFAConsolidationUI;