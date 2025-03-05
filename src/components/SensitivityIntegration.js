import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SensitivityVisualization.css';

/**
 * SensitivityIntegration component for integrating sensitivity analysis with the frontend.
 * This component provides a unified interface for running sensitivity analysis and displaying results.
 * It includes fallback logic for handling different server configurations.
 */
const SensitivityIntegration = ({ version, onError }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumContent, setAlbumContent] = useState(null);
  const [serverConfig, setServerConfig] = useState({
    mainServer: 'http://localhost:25007',
    fallbackServer: 'http://localhost:25007',
    useMainServer: true
  });

  // Function to detect which server is available
  const detectServer = async () => {
    try {
      // Try main server first
      const mainResponse = await axios.get(`${serverConfig.mainServer}/health`, { timeout: 2000 });
      if (mainResponse.status === 200) {
        setServerConfig(prev => ({ ...prev, useMainServer: true }));
        return;
      }
    } catch (error) {
      console.log('Main server not available, trying fallback');
    }

    try {
      // Try fallback server
      const fallbackResponse = await axios.get(`${serverConfig.fallbackServer}/health`, { timeout: 2000 });
      if (fallbackResponse.status === 200) {
        setServerConfig(prev => ({ ...prev, useMainServer: false }));
        return;
      }
    } catch (error) {
      console.log('Fallback server not available');
      if (onError) {
        onError('No server available for sensitivity analysis');
      }
    }
  };

  // Get the active server URL
  const getServerUrl = () => {
    return serverConfig.useMainServer ? serverConfig.mainServer : serverConfig.fallbackServer;
  };

  // Function to run sensitivity analysis
  const runSensitivityAnalysis = async (parameters) => {
    setLoading(true);
    try {
      // Step 1: Generate and save configurations
      console.log("Step 1: Generating sensitivity configurations...");
      const configEndpoint = '/sensitivity/configure';
      
      const configResponse = await axios.post(`${getServerUrl()}${configEndpoint}`, {
        selectedVersions: [version],
        selectedV: { V1: "on" },
        selectedF: { F1: "on", F2: "on", F3: "on", F4: "on", F5: "on" },
        selectedCalculationOption: "calculateForPrice",
        targetRow: 20,
        SenParameters: parameters
      });
      
      if (configResponse.data.status !== 'success') {
        throw new Error(configResponse.data.error || 'Failed to generate configurations');
      }
      
      console.log("Configurations generated successfully:", configResponse.data);
      
      // Step 2: Run calculations
      console.log("Step 2: Running sensitivity calculations...");
      const runEndpoint = '/runs';
      
      const runResponse = await axios.post(`${getServerUrl()}${runEndpoint}`, {
        selectedVersions: [version],
        selectedV: { V1: "on" },
        selectedF: { F1: "on", F2: "on", F3: "on", F4: "on", F5: "on" },
        selectedCalculationOption: "calculateForPrice",
        targetRow: 20,
        SenParameters: parameters
      });
      
      if (runResponse.data.status !== 'success') {
        throw new Error(runResponse.data.error || 'Failed to run calculations');
      }
      
      console.log("Calculations completed successfully:", runResponse.data);
      
      // Step 3: Generate visualizations
      console.log("Step 3: Generating visualizations...");
      const visualizeEndpoint = '/sensitivity/visualize';
      
      const visualizeResponse = await axios.post(`${getServerUrl()}${visualizeEndpoint}`, {
        selectedVersions: [version],
        selectedV: { V1: "on" },
        selectedF: { F1: "on", F2: "on", F3: "on", F4: "on", F5: "on" },
        selectedCalculationOption: "calculateForPrice",
        targetRow: 20,
        SenParameters: parameters
      });
      
      setResults(visualizeResponse.data);
      console.log("Visualizations generated successfully:", visualizeResponse.data);
      return visualizeResponse.data;
    } catch (error) {
      console.error('Error running sensitivity analysis:', error);
      
      // Try fallback if main server failed
      if (serverConfig.useMainServer) {
        try {
          setServerConfig(prev => ({ ...prev, useMainServer: false }));
          console.log("Trying fallback server...");
          
          // Use the fallback server with the same workflow
          return await runSensitivityAnalysis(parameters);
        } catch (fallbackError) {
          console.error('Fallback server also failed:', fallbackError);
          if (onError) {
            onError('Failed to run sensitivity analysis on both servers');
          }
        }
      } else if (onError) {
        onError('Failed to run sensitivity analysis');
      }
    } finally {
      setLoading(false);
    }
    return null;
  };

  // Function to get sensitivity albums
  const getSensitivityAlbums = async () => {
    setLoading(true);
    try {
      const endpoint = '/sensitivity/albums/' + version;
      const response = await axios.get(`${getServerUrl()}${endpoint}`);
      setAlbums(response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting sensitivity albums:', error);
      
      // Try fallback if main server failed
      if (serverConfig.useMainServer) {
        try {
          setServerConfig(prev => ({ ...prev, useMainServer: false }));
          const fallbackResponse = await axios.get(`${serverConfig.fallbackServer}/sensitivity/albums/${version}`);
          setAlbums(fallbackResponse.data);
          return fallbackResponse.data;
        } catch (fallbackError) {
          console.error('Fallback server also failed:', fallbackError);
          if (onError) {
            onError('Failed to get sensitivity albums from both servers');
          }
        }
      } else if (onError) {
        onError('Failed to get sensitivity albums');
      }
    } finally {
      setLoading(false);
    }
    return null;
  };

  // Function to get album content (plots or HTML)
  const getAlbumContent = async (albumType, albumName) => {
    setLoading(true);
    try {
      const endpoint = albumType === 'plot' 
        ? `/sensitivity/plots/${version}/${albumName}`
        : `/sensitivity/html/${version}/${albumName}`;
      
      const response = await axios.get(`${getServerUrl()}${endpoint}`);
      setAlbumContent(response.data);
      setSelectedAlbum({ type: albumType, name: albumName });
      return response.data;
    } catch (error) {
      console.error(`Error getting ${albumType} album content:`, error);
      
      // Try fallback if main server failed
      if (serverConfig.useMainServer) {
        try {
          setServerConfig(prev => ({ ...prev, useMainServer: false }));
          const fallbackEndpoint = albumType === 'plot' 
            ? `/sensitivity/plots/${version}/${albumName}`
            : `/sensitivity/html/${version}/${albumName}`;
          
          const fallbackResponse = await axios.get(`${serverConfig.fallbackServer}${fallbackEndpoint}`);
          setAlbumContent(fallbackResponse.data);
          setSelectedAlbum({ type: albumType, name: albumName });
          return fallbackResponse.data;
        } catch (fallbackError) {
          console.error('Fallback server also failed:', fallbackError);
          if (onError) {
            onError(`Failed to get ${albumType} album content from both servers`);
          }
        }
      } else if (onError) {
        onError(`Failed to get ${albumType} album content`);
      }
    } finally {
      setLoading(false);
    }
    return null;
  };

  // Function to get consolidated sensitivity results
  const getSensitivityResults = async () => {
    setLoading(true);
    try {
      const endpoint = `/sensitivity/results/${version}`;
      const response = await axios.get(`${getServerUrl()}${endpoint}`);
      setResults(response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting sensitivity results:', error);
      
      // Try fallback if main server failed
      if (serverConfig.useMainServer) {
        try {
          setServerConfig(prev => ({ ...prev, useMainServer: false }));
          const fallbackResponse = await axios.get(`${serverConfig.fallbackServer}/sensitivity/results/${version}`);
          setResults(fallbackResponse.data);
          return fallbackResponse.data;
        } catch (fallbackError) {
          console.error('Fallback server also failed:', fallbackError);
          if (onError) {
            onError('Failed to get sensitivity results from both servers');
          }
        }
      } else if (onError) {
        onError('Failed to get sensitivity results');
      }
    } finally {
      setLoading(false);
    }
    return null;
  };

  // Detect server on component mount
  useEffect(() => {
    detectServer();
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div className="sensitivity-loading">
        <div className="sensitivity-loading-spinner"></div>
        <p>Loading sensitivity analysis data...</p>
      </div>
    );
  }

  // Render component
  return (
    <div className="sensitivity-integration">
      <div className="sensitivity-server-info">
        <p>Using {serverConfig.useMainServer ? 'main' : 'fallback'} server for sensitivity analysis</p>
        <button onClick={detectServer} className="sensitivity-server-detect-btn">
          Detect Server
        </button>
      </div>
      
      {/* Example UI for sensitivity analysis */}
      <div className="sensitivity-actions">
        <button 
          onClick={() => getSensitivityAlbums()}
          className="sensitivity-action-btn"
        >
          Get Albums
        </button>
        <button 
          onClick={() => getSensitivityResults()}
          className="sensitivity-action-btn"
        >
          Get Results
        </button>
      </div>
      
      {/* Display albums if available */}
      {albums && albums.plot_albums && (
        <div className="sensitivity-albums">
          <h3>Plot Albums</h3>
          <div className="sensitivity-album-list">
            {albums.plot_albums.map(album => (
              <div 
                key={album.name}
                className="sensitivity-album-item"
                onClick={() => getAlbumContent('plot', album.name)}
              >
                <p>{album.metadata.display_name || album.name}</p>
                <span>{album.file_count} files</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {albums && albums.html_albums && (
        <div className="sensitivity-albums">
          <h3>HTML Albums</h3>
          <div className="sensitivity-album-list">
            {albums.html_albums.map(album => (
              <div 
                key={album.name}
                className="sensitivity-album-item"
                onClick={() => getAlbumContent('html', album.name)}
              >
                <p>{album.metadata.display_name || album.name}</p>
                <span>{album.file_count} files</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Display album content if selected */}
      {selectedAlbum && albumContent && (
        <div className="sensitivity-album-content">
          <h3>{albumContent.album}</h3>
          
          {selectedAlbum.type === 'plot' && albumContent.plots && (
            <div className="sensitivity-plots">
              {albumContent.plots.map(plot => (
                <div key={plot.name} className="sensitivity-plot-item">
                  <h4>{plot.name}</h4>
                  <img src={plot.url} alt={plot.name} />
                  {plot.param_info && (
                    <p>
                      Parameter: {plot.param_info.param_id} vs {plot.param_info.compare_to}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {selectedAlbum.type === 'html' && albumContent.html_files && (
            <div className="sensitivity-html-files">
              {albumContent.html_files.map(html => (
                <div key={html.name} className="sensitivity-html-item">
                  <h4>{html.name}</h4>
                  <div 
                    dangerouslySetInnerHTML={{ __html: html.content }}
                    className="sensitivity-html-content"
                  />
                  {html.param_info && (
                    <p>
                      Parameter: {html.param_info.param_id} vs {html.param_info.compare_to}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Display results if available */}
      {results && (
        <div className="sensitivity-results">
          <h3>Sensitivity Results</h3>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default SensitivityIntegration;
