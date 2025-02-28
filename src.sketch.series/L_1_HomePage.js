import React, { useState, useEffect, useMemo } from 'react';
import useFormValues from './useFormValues.js';
import GeneralFormConfig from './GeneralFormConfig.js';
import VersionSelector from './VersionSelector.js';
import PropertySelector from './PropertySelector.js';
import VersionControl from './components/version/VersionControl';
import CustomizableTable from './CustomizableTable';
import CustomizableImage from './CustomizableImage';
import MU from './MU.png'
import US_biomass from './US_biomass.png'
import FormHeader from './FormHeader.js';
import ExtendedScaling from './ExtendedScaling';
import { Tabs, Tab, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import './L_1_HomePage.css';
const L_1_HomePage = () => {
  const [activeTab, setActiveTab] = useState('Input');
  const [activeSubTab, setActiveSubTab] = useState('ProjectConfig');
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [season, setSeason] = useState('winter');

  // Loading States
  const [loadingStates, setLoadingStates] = useState({
    html: false,
    csv: false,
    plots: false
  });
  const [contentLoaded, setContentLoaded] = useState({});
  const [iframesLoaded, setIframesLoaded] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState({});

  // Content Loading States
  const [contentLoadingState, setContentLoadingState] = useState({
    csv: false,
    html: false,
    plots: false,
    iframes: {},
    images: {},
    content: {}
  });

  // Effect for tab transitions
  useEffect(() => {
    setContentLoadingState(prev => ({
      ...prev,
      csv: activeTab === 'Case1',
      html: activeTab === 'Case2',
      plots: activeTab === 'Case3',
      iframes: {},
      images: {},
      content: {}
    }));
  }, [activeTab]);

  // Effect for content loading
  useEffect(() => {
    if (contentLoadingState.csv || contentLoadingState.html || contentLoadingState.plots) {
      const timer = setTimeout(() => {
        setContentLoadingState(prev => ({
          ...prev,
          content: { ...prev.content, [activeTab]: true }
        }));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [contentLoadingState.csv, contentLoadingState.html, contentLoadingState.plots, activeTab]);

  // Drag and Drop State
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedItem: null,
    sourceIndex: null,
    dropTarget: null,
    ghostPosition: { x: 0, y: 0 }
  });

  const [droppedItems, setDroppedItems] = useState([]);
  const [activeConnections, setActiveConnections] = useState(new Set());
  const [reorderState, setReorderState] = useState({
    isReordering: false,
    placeholder: null
  });

  // Drag and Drop Event Handlers
  const handlePropertySelect = (item, index) => {
    setActiveConnections(new Set([item.id]));
    const droppedIndex = droppedItems.findIndex(dropped => dropped.id === item.id);
    if (droppedIndex !== -1) {
      const dropElement = document.querySelector(`[data-dropped-id="${item.id}"]`);
      const sourceElement = document.querySelector(`[data-property-id="${item.id}"]`);
      if (dropElement && sourceElement) {
        dropElement.classList.add('connected');
        sourceElement.classList.add('active-connection');
      }
    }
  };

  const handleDragStart = (e, item, index) => {
    const element = e.target;
    const rect = element.getBoundingClientRect();
    const ghostElement = element.cloneNode(true);

    setDragState({
      isDragging: true,
      draggedItem: item,
      sourceIndex: index,
      ghostPosition: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    });

    element.classList.add('dragging');
    ghostElement.classList.add('ghost');
    document.body.appendChild(ghostElement);

    e.dataTransfer.setDragImage(ghostElement, 0, 0);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    const dropZone = e.currentTarget;
    const rect = dropZone.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    // Calculate drop position
    const position = y < height / 2 ? 'before' : 'after';

    setReorderState(prev => ({
      isReordering: true,
      placeholder: {
        index: index,
        position: position
      }
    }));

    dropZone.classList.add('drop-active');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const { draggedItem, sourceIndex } = dragState;
    const dropZone = e.currentTarget;
    const { placeholder } = reorderState;

    if (!draggedItem) return;

    setDroppedItems(prev => {
      let newItems = [...prev];
      const existingIndex = newItems.findIndex(item => item.id === draggedItem.id);

      if (existingIndex !== -1) {
        // Reordering
        if (placeholder) {
          newItems = reorderItems(newItems, existingIndex, placeholder.index);
        }
      } else {
        // New drop
        newItems.push({
          ...draggedItem,
          droppedAt: new Date().getTime()
        });
      }

      return newItems;
    });

    // Cleanup
    dropZone.classList.remove('drop-active');
    const draggingElement = document.querySelector('.dragging');
    if (draggingElement) {
      draggingElement.classList.remove('dragging');
    }
    const ghostElement = document.querySelector('.ghost');
    if (ghostElement) {
      ghostElement.remove();
    }

    setDragState({
      isDragging: false,
      draggedItem: null,
      sourceIndex: null,
      dropTarget: null,
      ghostPosition: { x: 0, y: 0 }
    });

    setReorderState({
      isReordering: false,
      placeholder: null
    });
  };

  const handleDragEnd = () => {
    const draggingElement = document.querySelector('.dragging');
    if (draggingElement) {
      draggingElement.classList.remove('dragging');
    }
    const ghostElement = document.querySelector('.ghost');
    if (ghostElement) {
      ghostElement.remove();
    }

    setDragState({
      isDragging: false,
      draggedItem: null,
      sourceIndex: null,
      dropTarget: null,
      ghostPosition: { x: 0, y: 0 }
    });

    setReorderState({
      isReordering: false,
      placeholder: null
    });
  };

  const reorderItems = (items, startIndex, endIndex) => {
    const result = [...items];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const removeDroppedItem = (itemId) => {
    setDroppedItems(prev => prev.filter(item => item.id !== itemId));
    setActiveConnections(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  // Theme management
  useEffect(() => {
    // Remove previous theme data attribute
    document.body.removeAttribute('data-theme');
    // Set new theme
    document.body.setAttribute('data-theme', season);

    // Load theme CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${process.env.PUBLIC_URL}/styles/${season}.css`;

    // Remove any existing theme stylesheets
    const oldLink = document.querySelector('link[href*="/styles/"][href$=".css"]');
    if (oldLink) {
      oldLink.remove();
    }

    document.head.appendChild(link);
  }, [season]); // Update whenever season changes
  const { formValues, handleInputChange, handleReset, setFormValues } = useFormValues();
  const [version, setVersion] = useState('1');
  const [batchRunning, setBatchRunning] = useState(false);
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [csvFiles, setCsvFiles] = useState([]);
  const [subTab, setSubTab] = useState('');
  const [albumImages, setAlbumImages] = useState({});
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [albumHtmls, setAlbumHtmls] = useState({});
  const [selectedHtml, setSelectedHtml] = useState('');
  const [remarks, setRemarks] = useState('off');
  const [customizedFeatures, setcustomizedFeatures] = useState('off');
  const [selectedCalculationOption, setSelectedCalculationOption] = useState('freeFlowNPV');
  const [target_row, settarget_row] = useState('20');
  const [calculatedPrices, setCalculatedPrices] = useState({});
  const [baseCosts, setBaseCosts] = useState([]);
  const [collapsedTabs, setCollapsedTabs] = useState({});
  const [isToggleSectionOpen, setIsToggleSectionOpen] = useState(false);

  // Extract base costs from Process2Config values
  useEffect(() => {
    const process2Costs = Object.entries(formValues)
      .filter(([key, value]) => key.includes('Amount5'))
      .map(([key, value]) => ({
        id: key,
        label: value.label || 'Unnamed Cost',
        baseValue: parseFloat(value.value) || 0
      }));
    setBaseCosts(process2Costs);
  }, [formValues]);

  const handleScaledValuesChange = (scaledValues) => {
    console.log('Scaled values:', scaledValues);
    // Process scaled values as needed
  };

  const toggleTabCollapse = (tabId) => {
    setCollapsedTabs(prev => ({
      ...prev,
      [tabId]: !prev[tabId]
    }));
  };

  const loadConfiguration = async (version) => {
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

      const data = await response.json();
      const { filteredValues } = data;

      filteredValues.forEach(item => {
        let { id, value, remarks } = item;
        if (typeof value === 'string') {
          value = value.trim().replace(/^"|"$/g, '');
          value = isNaN(value) ? value : parseFloat(value);
        }

        setFormValues(prevValues => ({
          ...prevValues,
          [id]: {
            ...prevValues[id],
            value: typeof value === 'number' ? value : prevValues[id].value,
            remarks: remarks !== undefined ? remarks : prevValues[id].remarks
          }
        }));
      });

      console.log('Updated formValues:', formValues);
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const handleOptionChange = (event) => {
    setSelectedCalculationOption(event.target.value);
  };

  const handleTargetRowChange = (event) => {
    settarget_row(event.target.value);
  };

  const toggleRemarks = () => {
    setRemarks(prevState => (prevState === 'off' ? 'on' : 'off'));
  };

  const toggleCustomizedFeatures = () => {
    setcustomizedFeatures(prevState => (prevState === 'off' ? 'on' : 'off'));
  };

  const handleRefresh = () => {
    setVersion('0');
    setTimeout(() => {
      setVersion(version);
    }, 1);
  };

  const updatePrice = (version, price) => {
    setCalculatedPrices((prevPrices) => ({
      ...prevPrices,
      [version]: price,
    }));
  };

  // States for F1-F5 and V1-V10
  const [F, setF] = useState({ F1: 'off', F2: 'off', F3: 'off', F4: 'off', F5: 'off' });
  const [V, setV] = useState({ V1: 'off', V2: 'off', V3: 'off', V4: 'off', V5: 'off', V6: 'off', V7: 'off', V8: 'off', V9: 'off', V10: 'off' });

  // Initialize S10 through S61
  const [S, setS] = useState(() => {
    const initialS = {};
    for (let i = 10; i <= 61; i++) {
      initialS[`S${i}`] = {
        mode: null,
        values: [],
        enabled: false
      };
    }
    return initialS;
  });

  // ... [Keep all existing functions and handlers]

  const handleThemeChange = (newSeason) => {
    setSeason(newSeason);
    document.body.className = newSeason;
  };

  const toggleF = (key) => {
    setF(prev => ({
      ...prev,
      [key]: prev[key] === 'off' ? 'on' : 'off'
    }));
  };

  const toggleV = (key) => {
    setV(prev => ({
      ...prev,
      [key]: prev[key] === 'off' ? 'on' : 'off'
    }));
  };

  const createNewBatch = async () => {
    setBatchRunning(true);
    try {
      const response = await fetch('http://127.0.0.1:8001/create_new_batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok) {
        console.log(result.message);
        console.log("New Batch Number:", result.NewBatchNumber);
        setVersion(result.NewBatchNumber);  // Update the version state with the new batch number
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Batch creation failed', error);
    } finally {
      setBatchRunning(false);
    }
  };

  const RemoveBatch = async () => {
    try {
      const response = await fetch('http://127.0.0.1:7001/Remove_batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ version }),
      });
      const result = await response.json();
      if (response.ok) {
        setVersion(result.max_version);  // Update the version state with the max batch number
      } else {
        console.error('Batch removal failed');
      }
    } catch (error) {
      console.error('Error during batch removal:', error);
    }
  };


  const checkAndCreateUploads = async () => {
    setAnalysisRunning(true);
    try {
      const response = await fetch('http://127.0.0.1:8007/check_and_create_uploads', {
        method: 'POST',
      });
      const result = await response.json();
      if (response.ok) {
        console.log(result.message);
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Analysis failed', error);
    } finally {
      setAnalysisRunning(false);
    }
  };

  // ---------------- Homepage End ----------------
  // ---------------- Analysis Start ----------------

  const handleRun = async () => {
    setAnalysisRunning(true);
    setCalculatedPrices({}); // Reset all previous prices at the start of a new run

    try {
      const response = await fetch('http://127.0.0.1:5007/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedVersions,
          selectedV: V,
          selectedF: F,
          selectedCalculationOption: selectedCalculationOption,
          targetRow: target_row,
          SenParameters: S,
        }),
      });

      if (selectedCalculationOption === 'calculateForPrice') {
        // Handle dynamic streaming of prices for each version
        selectedVersions.forEach((version) => {
          const eventSource = new EventSource(`http://127.0.0.1:5007/stream_price/${version}`);

          eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(`Streamed Price for version ${version}:`, data.price);

            // Update the specific version's price in state
            updatePrice(version, data.price);

            // Close the stream if the backend signals completion
            if (data.complete) {
              console.log(`Completed streaming for version ${version}`);
              eventSource.close();
            }
          };

          eventSource.onerror = (error) => {
            console.error(`Error in SSE stream for version ${version}:`, error);
            eventSource.close(); // Close the stream on error
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

  const handleRunPNG = async () => {
    setAnalysisRunning(true);
    try {
      const response = await fetch('http://127.0.0.1:5008/runPNG', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedVersions, selectedProperties, remarks, customizedFeatures }),
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

  const handleRunSub = async () => {
    setAnalysisRunning(true);
    try {
      const response = await fetch('http://127.0.0.1:5009/runSub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedVersions, selectedProperties, remarks, customizedFeatures, selectedV: V }),
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

  // ---------------- Analysis End ----------------
  // ---------------- Form Start ----------------

  const handleSubmitCompleteSet = async () => {
    const formItems = Object.keys(formValues)
      .filter((key) => ['Amount1', 'Amount2', 'Amount3', 'Amount4', 'Amount5', 'Amount6'].some((amt) => key.includes(amt)))
      .map((key) => ({
        id: key,
        ...formValues[key],
      }));

    const filteredValues = formItems.map((item) => {
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

      const result = await response.text();
      console.log(result);
    } catch (error) {
      console.error('Error during parameter submission:', error);
    }
  };

  // ---------------- HTML Content Handling Block Start ----------------

  // Fetch HTML files based on version
  useEffect(() => {
    const fetchHtmlFiles = async () => {
      try {
        const response = await fetch(`http://localhost:8009/api/album_html/${version}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Group HTML files by album
        const albumGroupedHtmls = data.reduce((acc, html) => {
          const { album } = html;
          if (!acc[album]) {
            acc[album] = [];
          }
          acc[album].push(html);
          return acc;
        }, {});

        setAlbumHtmls(albumGroupedHtmls); // Update the HTML paths for the specified version

        // Automatically select the first album that has HTML files
        const firstAlbumWithHtml = Object.keys(albumGroupedHtmls)[0];
        if (firstAlbumWithHtml) {
          setSelectedHtml(firstAlbumWithHtml);
        }
      } catch (error) {
        console.error('Error fetching HTML files:', error);
      }
    };

    fetchHtmlFiles();
  }, [version]);

  const transformPathToUrlh = (filePath) => {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const baseUrl = `http://localhost:3000/Original`;

    const match = normalizedPath.match(/Batch\((\d+)\)\/Results\(\d+\)\/([^\/]+)\/([^\/]+\.html)$/);
    if (match) {
      const version = match[1];
      const album = match[2];
      const fileName = normalizedPath.split('/').pop();
      return `${baseUrl}/Batch(${version})/Results(${version})/${album}/${fileName}`;
    }
    return normalizedPath;
  };

  const transformAlbumName = (album) => {
    // Extract the version numbers and the description part
    const match = album.match(/v((\d+_)+)(.+)/);
    if (match) {
      // Extract and format the version numbers
      const versions = match[1].slice(0, -1).replace(/_/g, ', ');
      // Extract and format the description, adding spaces between capital letters
      const description = match[3].replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
      return `${description} for versions [${versions}]`;
    }
    return album.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  const renderHtmlContent = () => {
    if (!selectedHtml || !albumHtmls[selectedHtml]) return null;

    return albumHtmls[selectedHtml].map((html, index) => {
      const htmlUrl = transformPathToUrlh(html.path);
      return (
        <div
          key={index}
          className={`html-content ${iframesLoaded[index] ? 'loaded' : ''}`}
        >
          <iframe
            src={htmlUrl}
            title={html.name}
            width="100%"
            height="600px"
            style={{ margin: '10px' }}
            onLoad={() => {
              setIframesLoaded(prev => ({ ...prev, [index]: true }));
            }}
            className={iframesLoaded[index] ? 'loaded' : ''}
          />
        </div>
      );
    });
  };

  const renderCase2Content = () => {
    if (!albumHtmls || Object.keys(albumHtmls).length === 0) return <div>No HTML files available</div>;

    return (
      <Tabs
        selectedIndex={Object.keys(albumHtmls).indexOf(selectedHtml)}
        onSelect={(index) => setSelectedHtml(Object.keys(albumHtmls)[index])}
      >
        <TabList>
          {Object.keys(albumHtmls).map((album) => (
            <Tab key={album}>{transformAlbumName(album)}</Tab>
          ))}
        </TabList>
        {Object.keys(albumHtmls).map((album) => (
          <TabPanel key={album}>
            {renderHtmlContent()}
          </TabPanel>
        ))}
      </Tabs>
    );
  };

  // ---------------- HTML Content Handling Block End ----------------
  // ---------------- Plot Content Handling Block Start ----------------

  // Fetch album images based on version
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`http://localhost:8008/api/album/${version}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Group images by album
        const albumGroupedImages = data.reduce((acc, image) => {
          const { album } = image;
          if (!acc[album]) {
            acc[album] = [];
          }
          acc[album].push(image);
          return acc;
        }, {});

        setAlbumImages(albumGroupedImages); // Update the image paths for the specified version

        // Automatically select the first album that has images
        const firstAlbumWithImages = Object.keys(albumGroupedImages)[0];
        if (firstAlbumWithImages) {
          setSelectedAlbum(firstAlbumWithImages);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, [version]);

  const transformPathToUrl = (filePath) => {
    // Normalize the file path to replace backslashes with forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Updated base URL for serving images from the public directory in React
    const baseUrl = 'http://localhost:3000/Original';

    // Extract version and album from the normalized path and construct the correct URL
    const match = normalizedPath.match(/Batch\((\d+)\)\/Results\(\d+\)\/([^\/]+)\/([^\/]+\.png)$/);

    if (match) {
      const version = match[1];
      const album = match[2];
      const fileName = normalizedPath.split('/').pop(); // Get the file name from the path
      return `${baseUrl}/Batch(${version})/Results(${version})/${album}/${fileName}`;
    }
    return normalizedPath; // Return the normalized path if no match
  };

  const transformAlbumNamePlot = (album) => {
    // Extract the version numbers and the description part
    const match = album.match(/((\d+_)+)(.+)/);
    if (match) {
      // Extract and format the version numbers
      const versions = match[1].slice(0, -1).replace(/_/g, ', ');
      // Extract and format the description, adding spaces between capital letters
      const description = match[3].replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
      return `${description} for versions [${versions}]`;
    }
    return album.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  const renderPlotContent1 = () => {
    if (!selectedAlbum || !albumImages[selectedAlbum]) return null;

    return albumImages[selectedAlbum].map((image, index) => {
      const imageUrl = transformPathToUrl(image.path);
      return (
        <div
          key={index}
          className={`plot-content ${imagesLoaded[index] ? 'loaded' : ''}`}
        >
          <CustomizableImage
            src={imageUrl}
            alt={image.name}
            width="600"
            height="400"
            style={{ margin: '10px' }}
            onLoad={() => {
              setImagesLoaded(prev => ({ ...prev, [index]: true }));
            }}
            className={imagesLoaded[index] ? 'loaded' : ''}
          />
        </div>
      );
    });
  };

  const renderCase3Content = () => {
    if (!albumImages || Object.keys(albumImages).length === 0) return <div>No PNG files available</div>;

    return (
      <Tabs selectedIndex={Object.keys(albumImages).indexOf(selectedAlbum)} onSelect={(index) => setSelectedAlbum(Object.keys(albumImages)[index])}>
        <TabList>
          {Object.keys(albumImages).map((album) => (
            <Tab key={album}>{transformAlbumNamePlot(album)}</Tab>
          ))}
        </TabList>
        {Object.keys(albumImages).map((album) => (
          <TabPanel key={album}>
            {renderPlotContent1()}
          </TabPanel>
        ))}
      </Tabs>
    );
  };

  // ---------------- Plot End ----------------

  // ---------------- Table Start ----------------
  // Fetch CSV files based on version
  useEffect(() => {
    const fetchCsvFiles = async () => {
      try {
        const response = await fetch(`http://localhost:8007/api/csv-files/${version}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCsvFiles(data);
        setSubTab(data.length > 0 ? data[0].name : ''); // Set the first file as the default subtab if none is active
      } catch (error) {
        console.error('Error fetching CSV files:', error);
      }
    };

    fetchCsvFiles();
  }, [version]);

  // Update subTab based on activeSubTab and ensure it's valid
  useEffect(() => {
    if (csvFiles.length > 0) {
      const fileNames = csvFiles.map(file => file.name);
      if (!fileNames.includes(subTab)) {
        setSubTab(fileNames[0]); // Set to the first available file if subTab is not in the list
      }
    }
  }, [csvFiles, subTab]);

  const handleVersionChange = (event) => {
    setVersion(event.target.value);
  };


  // ---------------- Table Rendering Start ----------------

  const renderCase1Content = () => {

    // Name mapping for specific files to more presentable names
    const nameMapping = {
      [`CFA(${version}).csv`]: 'Cash Flow Analysis',
      [`Economic_Summary(${version}).csv`]: 'Economic Summary',
      [`Cumulative_Opex_Table_(${version}).csv`]: 'Cumulative Opex Table',
      [`Filtered_Value_Intervals(${version}).csv`]: 'Filtered Value Intervals',
      [`Fixed_Opex_Table_(${version}).csv`]: 'Fixed Opex Table',
      [`Variable_Opex_Table_(${version}).csv`]: 'Variable Opex Table',
      [`Configuration_Matrix(${version}).csv`]: 'Configuration Matrix',
      [`Distance_From_Paying_Taxes(${version}).csv`]: 'Distance from Paying Taxes',
      [`Sorted_Points(${version}).csv`]: 'Sorted Points',
      [`Variable_Table(${version}).csv`]: 'Variable Table'
    };

    // Exclude these files from display (if any)
    const exclusionArray = [
      `Configuration_Matrix(${version}).csv`,
      `Distance_From_Paying_Taxes(${version}).csv`,
      `Sorted_Points(${version}).csv`,
      `Fixed_Opex_Table_${version}.csv`,
      `Variable_Opex_Table_${version}.csv`,
      `Filtered_Value_Intervals(${version}).csv`,
    ];

    // Filter and sort the CSV files
    const sortedCsvFiles = [...csvFiles]
      .filter(file => !exclusionArray.includes(file.name)) // Filter out excluded files
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort files alphabetically

    return (
      <Tabs selectedIndex={sortedCsvFiles.findIndex((file) => file.name === subTab)} onSelect={(index) => setSubTab(sortedCsvFiles[index]?.name || '')}>
        <TabList>
          {sortedCsvFiles.map((file) => (
            <Tab key={file.name}>
              {nameMapping[file.name] || file.name.replace(`(${version})`, '')} {/* Use mapped name or fallback to filename without version */}
            </Tab>
          ))}
        </TabList>
        {sortedCsvFiles.map((file) => (
          <TabPanel key={file.name}>
            <CustomizableTable data={file.data} fileName={file.name} />

          </TabPanel>
        ))}
      </Tabs>
    );
  };

  // ---------------- Table End ----------------

  const renderForm = () => (
    <div className="form-container">
      <div className="sub-tab-buttons">
        <button className={`sub-tab-button ${activeSubTab === 'ProjectConfig' ? 'active' : ''}`} onClick={() => setActiveSubTab('ProjectConfig')}>
          Project Configuration
        </button>
        <button className={`sub-tab-button ${activeSubTab === 'LoanConfig' ? 'active' : ''}`} onClick={() => setActiveSubTab('LoanConfig')}>
          Loan Configuration
        </button>
        <button className={`sub-tab-button ${activeSubTab === 'RatesConfig' ? 'active' : ''}`} onClick={() => setActiveSubTab('RatesConfig')}>
          Rates & Fixed Costs
        </button>
        <button className={`sub-tab-button ${activeSubTab === 'Process1Config' ? 'active' : ''}`} onClick={() => setActiveSubTab('Process1Config')}>
          Process Quantities (Vs, units)
        </button>
        <button className={`sub-tab-button ${activeSubTab === 'Process2Config' ? 'active' : ''}`} onClick={() => setActiveSubTab('Process2Config')}>
          Process Costs <br /> (Vs, $ / unit)
        </button>
      </div>
      <div className="form-content">
        {activeSubTab && <FormHeader />}
        {activeSubTab === 'ProjectConfig' && <GeneralFormConfig formValues={formValues} handleInputChange={handleInputChange} version={version} filterKeyword="Amount1" S={S} setS={setS} setVersion={setVersion} />}
        {activeSubTab === 'LoanConfig' && <GeneralFormConfig formValues={formValues} handleInputChange={handleInputChange} version={version} filterKeyword="Amount2" S={S} setS={setS} setVersion={setVersion} />}
        {activeSubTab === 'RatesConfig' && <GeneralFormConfig formValues={formValues} handleInputChange={handleInputChange} version={version} filterKeyword="Amount3" F={F} setF={setF} S={S} setS={setS} setVersion={setVersion} />}
        {activeSubTab === 'Process1Config' && <GeneralFormConfig formValues={formValues} handleInputChange={handleInputChange} version={version} filterKeyword="Amount4" V={V} setV={setV} S={S} setS={setS} setVersion={setVersion} />}
        {activeSubTab === 'Process2Config' && <GeneralFormConfig formValues={formValues} handleInputChange={handleInputChange} version={version} filterKeyword="Amount5" V={V} setV={setV} S={S} setS={setS} setVersion={setVersion} />}
        {activeSubTab === 'Process3Config' && <GeneralFormConfig formValues={formValues} handleInputChange={handleInputChange} version={version} filterKeyword="Amount6" S={S} setS={setS} setVersion={setVersion} />}

          <div className="form-action-buttons">
            {/* First row: Load Configuration and Version Input */}
            <div className="button-row config-row">
              <div className="tooltip-container">
                <button
                  type="button"
                  onClick={() => loadConfiguration(version)}
                  style={{ backgroundColor: '#5C27cv', color: 'white', fontWeight: 'bold', padding: '10px', border: 'none', cursor: 'pointer' }}>
                  Load Configuration
                </button>
              </div>
              <div className="version-input-container">
                <input
                  id="versionNumber"
                  type="number"
                  className="version-input"
                  placeholder="1"
                  value={version}
                  onChange={handleVersionChange}
                />
              </div>
            </div>

            {/* Second row: Checkboxes */}
            <div className="button-row checkbox-row">
              <label>
                <input
                  type="checkbox"
                  checked={remarks === 'on'}
                  onChange={toggleRemarks}
                />
                Remarks
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={customizedFeatures === 'on'}
                  onChange={toggleCustomizedFeatures}
                />
                Customized Features
              </label>
            </div>

            {/* Third row: Visualization buttons */}
            <div className="button-row visualization-row">
              <div className="tooltip-container">
                <button
                  onClick={handleRunPNG}
                  style={{ backgroundColor: '#4CAF50', color: 'white', fontWeight: 'bold', padding: '10px', border: 'none', cursor: 'pointer' }}>
                  Generate PNG Plots
                </button>
                <span className="tooltip1">Choose the attributes thou wishest to grace the legend, and with a click, summon forth the PNG plots.</span>
              </div>
              <div className="tooltip-container">
                <button
                  type="button"
                  onClick={handleRunSub}
                  style={{ backgroundColor: '#2196F3', color: 'white', fontWeight: 'bold', padding: '10px', border: 'none', cursor: 'pointer' }}>
                  Generate Dynamic Plots
                </button>
                <span className="tooltip1">Seize the power of efficacy to tailor thy analysis, then click to conjure dynamic plots.</span>
              </div>
            </div>

            {/* Fourth row: Practical buttons */}
            <div className="button-row practical-row">
              <div className="tooltip-container">
                <button
                  onClick={handleRun}
                  style={{ backgroundColor: '#FF5722', color: 'white', fontWeight: 'bold', padding: '10px', border: 'none', cursor: 'pointer' }}>
                  Run CFA
                </button>
                <span className="tooltip1">
                  <p className="left-aligned-text">
                    Engage the button to unleash a thorough cash flow analysis
                    <br /><br />
                    - Cumulative cash flows<br />
                    - Annual revenues<br />
                    - Operating expenses<br />
                    - Loan repayment terms<br />
                    - Depreciation schedules<br />
                    - State taxes<br />
                    - Federal taxes<br />
                    - Annual cash flows
                  </p>
                </span>
              </div>
              <div className="tooltip-container">
                <button
                  onClick={handleSubmitCompleteSet}
                  style={{ backgroundColor: '#9C27B0', color: 'white', fontWeight: 'bold', padding: '10px', border: 'none', cursor: 'pointer' }}>
                  Submit Complete Set
                </button>
              </div>
              <div className="tooltip-container">
                <button
                  type="button"
                  onClick={handleReset}
                  style={{ backgroundColor: '#5C27B0', color: 'white', fontWeight: 'bold', padding: '10px', border: 'none', cursor: 'pointer' }}>
                  Reset
                </button>
              </div>
            </div>
          <div style={{ textAlign: 'center' }}>

          </div>
        </div>
        <div className="calculation-options">
          <div className="calculation-row">
            <div className="calculation-input-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="calculationOption"
                  value="calculateForPrice"
                  checked={selectedCalculationOption === 'calculateForPrice'}
                  onChange={handleOptionChange}
                />
                Calculate for Price, Zeroing NPV at Year
              </label>
              <div className="target-row-container">
                <input
                  type="number"
                  className="target-row-input"
                  placeholder="Enter Year"
                  value={target_row}
                  onChange={handleTargetRowChange}
                />
              </div>
            </div>
          </div>
          <div className="live-streams">
            {selectedVersions.map((version) => (
              <div key={version} className="price-result">
                <span>{calculatedPrices[version] || ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="version-selector-container">
        <PropertySelector selectedProperties={selectedProperties} setSelectedProperties={setSelectedProperties} />
        <VersionSelector selectedVersions={selectedVersions} setSelectedVersions={setSelectedVersions} />
      </div>
    </div>
  );



  // ---------------- Form End ----------------

  // ---------------- Table Rendering End ----------------

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Input':
        return renderForm();
      case 'Case1':
        return renderCase1Content();
      case 'Case2':
        return renderCase2Content();
      case 'Case3':
        return renderCase3Content();
      case 'Scaling':
        return <ExtendedScaling baseCosts={baseCosts} onScaledValuesChange={handleScaledValuesChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="L_1_HomePage">
      {/* Header Section */}
      <div className="L_1_HomePageSectionA">
        <div className="about-us-image1">
        </div>

        <div className="L_1_HomePageSectionT">
          <h2 className="h2-large">TEA Space</h2>
          <h2 className="h2-small">Techno-Economic-Social Simulation and Dynamic Modeling</h2>
        </div>

        {/* Theme controls moved to header */}
        <div className="theme-ribbon">
          <button className={`theme-button ${season === 'fall' ? 'active' : ''}`} onClick={() => handleThemeChange('fall')}>
            Creative
          </button>
          <button className={`theme-button ${season === 'winter' ? 'active' : ''}`} onClick={() => handleThemeChange('winter')}>
            Normal
          </button>
        </div>
      </div>
      {/* Main Content Grid */}
      <div className="main-content">
        {/* Model Zone - 20% */}
        <div className="model-zone">
          {/* Model management structure will go here */}
        </div>

        {/* Analysis Zone - 20% */}
        <div className="analysis-zone">
          <div className="workflow-steps">
            {/* Batch Management Step */}
            <div className={`workflow-step ${batchRunning ? 'active' : ''}`}>
              <div className="step-content">
                <button
                  className="primary-action"
                  onClick={createNewBatch}
                  disabled={batchRunning || analysisRunning}
                >
                  {batchRunning ? (
                    <span className="loading-text">Creating New Batch</span>
                  ) : (
                    <span className="action-text">Create New Batch</span>
                  )}
                </button>
                <button
                  className="secondary-action"
                  onClick={RemoveBatch}
                  disabled={batchRunning || analysisRunning}
                >
                  <span className="action-text">Remove Current Batch</span>
                </button>
              </div>
            </div>

            {/* Analysis Step */}
            <div className={`workflow-step ${analysisRunning ? 'active' : ''}`}>
              <div className="step-content">
                <button
                  className="primary-action"
                  onClick={handleRun}
                  disabled={batchRunning || analysisRunning}
                >
                  {analysisRunning ? (
                    <span className="loading-text">Running Analysis</span>
                  ) : (
                    <span className="action-text">Run Cash Flow Analysis</span>
                  )}
                </button>
              </div>
            </div>

            {/* Model Combination Step */}
            <div className="workflow-step">
              <div className="step-content">
                <button
                  className="primary-action"
                  onClick={checkAndCreateUploads}
                  disabled={batchRunning || analysisRunning}
                >
                  <span className="action-text">Combine TEA Models</span>
                </button>
              </div>
            </div>
          </div>
          {/* Analysis controls */}
          <div className="analysis-controls">
            <VersionControl
              version={version}
              onVersionChange={setVersion}
              onRefresh={handleRefresh}
              disabled={batchRunning || analysisRunning}
            />
          </div>
        </div>

        {/* Form Content - 50% */}
        <div className="form-content">
          <nav className="L_1_HomePageTabs" style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'var(--sidebar-background)' }}>
            <button className={`tab-button ${activeTab === 'Input' ? 'active' : ''}`} onClick={() => setActiveTab('Input')}>
              Input
            </button>
            <button className={`tab-button ${activeTab === 'Case1' ? 'active' : ''}`} onClick={() => setActiveTab('Case1')}>
              Cash Flow Analysis
            </button>
            <button className={`tab-button ${activeTab === 'Case2' ? 'active' : ''}`} onClick={() => setActiveTab('Case2')}>
              Dynamic SubPlots
            </button>
            <button className={`tab-button ${activeTab === 'Case3' ? 'active' : ''}`} onClick={() => setActiveTab('Case3')}>
              Plots
            </button>
            <button className={`tab-button ${activeTab === 'Scaling' ? 'active' : ''}`} onClick={() => setActiveTab('Scaling')}>
              Scaling
            </button>
          </nav>
          <div className="L_1_HomePageTabContent">
            {renderTabContent()}
          </div>
        </div>

        {/* Selection Zone - 10% */}
        <div className="selection-zone">
          <div className="model-selection">
            <VersionSelector
              selectedVersions={selectedVersions}
              setSelectedVersions={setSelectedVersions}
            />
          </div>
          <div
            className={`preview-canvas ${dragState.isDragging ? 'drop-active' : ''}`}
            onDragOver={(e) => handleDragOver(e, droppedItems.length)}
            onDrop={handleDrop}
          >
            <div className="property-list-container">
              <PropertySelector
                selectedProperties={selectedProperties}
                setSelectedProperties={setSelectedProperties}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                activeConnections={activeConnections}
                onSelect={handlePropertySelect}
              />
            </div>
            <h3 style={{ margin: '10px 0', padding: '0 10px' }}>Preview Canvas</h3>

            <div className="dropped-items-container">
              {droppedItems.length === 0 ? (
                <div className="empty-state">
                  Drop properties here to begin
                </div>
              ) : (
                droppedItems.map((item, index) => (
                  <div
                    key={`${item.id}-${item.droppedAt}`}
                    className={`dropped-item ${activeConnections.has(item.id) ? 'connected' : ''
                      }`}
                    data-dropped-id={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="property-icon">
                      {/* Icon based on property type */}
                      <span className="icon-placeholder">⚡</span>
                    </div>
                    <div className="dropped-item-content">
                      <div className="dropped-item-title">{item.name}</div>
                      <div className="dropped-item-subtitle">{item.description}</div>
                    </div>
                    <button
                      className="remove-dropped-item"
                      onClick={() => removeDroppedItem(item.id)}
                      title="Remove property"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
              {reorderState.isReordering && (
                <div
                  className="reorder-placeholder"
                  style={{
                    '--item-height': '3.5rem',
                    transform: `translateY(${reorderState.placeholder.position === 'before' ? '-0.75rem' : '0.75rem'
                      })`
                  }}
                />
              )}
            </div>
            <div className="drop-zone-indicator">
              <span className="indicator-text">Drop to add property</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default L_1_HomePage;
