import { useEffect, useState } from 'react';
import { VersionStateProvider } from './contexts/VersionStateContext';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import CustomizableImage from './CustomizableImage';
import CustomizableTable from './CustomizableTable';
import ExtendedScaling from './ExtendedScaling';
import FormHeader from './FormHeader.js';
import GeneralFormConfig from './GeneralFormConfig.js';
import Popup from './Popup.js';
import './L_1_HomePage1.css';
import './L_1_HomePage2.css';
import './L_1_HomePage3.css';
import './L_1_HomePage4.css';
import './L_1_HomePage5.css';
import './L_1_HomePage6.css';
import PropertySelector from './PropertySelector.js';
import TodoList from './TodoList.js';
import VersionSelector from './VersionSelector.js';
import ModelZone from './components/model/ModelZone';
import VersionControl from './components/version/VersionControl';
import EditableHierarchicalList from './Editable';
import SpatialTransformComponent from './naturalmotion';
import useFormValues from './useFormValues.js';

const L_1_HomePageContent = () => {
    const [activeTab, setActiveTab] = useState('Input');
    const [activeSubTab, setActiveSubTab] = useState('ProjectConfig');
    const [selectedProperties, setSelectedProperties] = useState([]);
    const [selectedVersions, setSelectedVersions] = useState([]);  // Add state for selected versions
    const [season, setSeason] = useState('winter'); // 'winter', 'fall', or 'dark'
    // Sensitivity Analysis State
    const [S, setS] = useState(() => {
        const initialS = {};
        for (let i = 10; i <= 61; i++) {
            initialS[`S${i}`] = {
                mode: null,
                values: [],
                enabled: false,
                compareToKey: '',
                comparisonType: null,
                waterfall: false,
                bar: false,
                point: false,
            };
        }
        return initialS;
    });

    // Loading States
    const [loadingStates, setLoadingStates] = useState({
        html: false,
        csv: false,
        plots: false,
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
        content: {},
    });

    // Add new state for sensitivity results
    const [sensitivityResults, setSensitivityResults] = useState({});
    const [showSensitivityTab, setShowSensitivityTab] = useState(false);

    // Effect for tab transitions
    useEffect(() => {
        setContentLoadingState((prev) => ({
            ...prev,
            csv: activeTab === 'Case1',
            html: activeTab === 'Case2',
            plots: activeTab === 'Case3',
            iframes: {},
            images: {},
            content: {},
        }));
    }, [activeTab]);

    // Effect for content loading
    useEffect(() => {
        if (contentLoadingState.csv || contentLoadingState.html || contentLoadingState.plots) {
            const timer = setTimeout(() => {
                setContentLoadingState((prev) => ({
                    ...prev,
                    content: { ...prev.content, [activeTab]: true },
                }));
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [contentLoadingState.csv, contentLoadingState.html, contentLoadingState.plots, activeTab]);

    // Theme management
    useEffect(() => {
        // Remove previous theme data attribute
        document.documentElement.removeAttribute('data-theme');
        // Set new theme
        document.documentElement.setAttribute('data-theme', season);

        // Load theme CSS if it exists (for fall/winter themes)
        if (season !== 'dark') {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${process.env.PUBLIC_URL}/styles/${season}.css`;

            // Remove any existing theme stylesheets
            const oldLink = document.querySelector('link[href*="/styles/"][href$=".css"]');
            if (oldLink) {
                oldLink.remove();
            }

            document.head.appendChild(link);
        }
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
    const [selectedCalculationOption, setSelectedCalculationOption] = useState('calculateForPrice');
    const [target_row, settarget_row] = useState('20');
    const [calculatedPrices, setCalculatedPrices] = useState({});
    const [baseCosts, setBaseCosts] = useState([]);
    const [scalingGroups, setScalingGroups] = useState([]);
    const [collapsedTabs, setCollapsedTabs] = useState({});
    const [isToggleSectionOpen, setIsToggleSectionOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

    // Extract base costs from Process2Config values
    useEffect(() => {
        const process2Costs = Object.entries(formValues)
            .filter(([key, value]) => key.includes('Amount5'))
            .map(([key, value]) => ({
                id: key,
                label: value.label || 'Unnamed Cost',
                value: value.value,
                baseValue: parseFloat(value.value) || 0,
            }));
        setBaseCosts(process2Costs);
    }, [formValues]);

    const handleScaledValuesChange = (scaledValues) => {
        console.log('Scaled values:', scaledValues);
    };

    const handleScalingGroupsChange = (newGroups) => {
        setScalingGroups(newGroups);
    };

    const toggleTabCollapse = (tabId) => {
        setCollapsedTabs((prev) => ({
            ...prev,
            [tabId]: !prev[tabId],
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

            filteredValues.forEach((item) => {
                let { id, value, remarks } = item;
                if (typeof value === 'string') {
                    value = value.trim().replace(/^"|"$/g, '');
                    value = isNaN(value) ? value : parseFloat(value);
                }

                setFormValues((prevValues) => ({
                    ...prevValues,
                    [id]: {
                        ...prevValues[id],
                        value: typeof value === 'number' ? value : prevValues[id].value,
                        remarks: remarks !== undefined ? remarks : prevValues[id].remarks,
                    },
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
        setRemarks((prevState) => (prevState === 'off' ? 'on' : 'off'));
    };

    const toggleCustomizedFeatures = () => {
        setcustomizedFeatures((prevState) => (prevState === 'off' ? 'on' : 'off'));
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
    const [V, setV] = useState({
        V1: 'off',
        V2: 'off',
        V3: 'off',
        V4: 'off',
        V5: 'off',
        V6: 'off',
        V7: 'off',
        V8: 'off',
        V9: 'off',
        V10: 'off',
    });

    const handleThemeChange = (newSeason) => {
        const themeRibbon = document.querySelector('.theme-ribbon');
        const currentLogo = document.querySelector('.logo-container img.active');
        const newLogo = document.querySelector(
            `.logo-container img[alt="${newSeason === 'winter' ? 'MU Logo' : newSeason === 'fall' ? 'US Biomass Logo' : 'Blue Parrot Logo'}"]`
        );
        const buttons = document.querySelectorAll('.theme-button');
        const targetButton =
            newSeason === 'dark' ? buttons[2] : newSeason === 'fall' ? buttons[0] : buttons[1];

        // Prevent multiple transitions
        if (themeRibbon && themeRibbon.classList.contains('theme-transition')) {
            return;
        }

        // Add direction-based class for transition effects
        if (themeRibbon) {
            // Calculate button positions and set transition properties
            const targetButtonRect = targetButton?.getBoundingClientRect();
            const ribbonRect = themeRibbon.getBoundingClientRect();
            const creativeButton = buttons[0]?.getBoundingClientRect();

            if (targetButtonRect && ribbonRect && creativeButton) {
                // Calculate horizontal and vertical distances for diagonal movement
                const startX = ribbonRect.right - targetButtonRect.right + 35;
                const startY = ribbonRect.bottom - targetButtonRect.bottom;
                const endX = ribbonRect.right - creativeButton.right + 35;
                const endY = ribbonRect.bottom - creativeButton.bottom;

                // Set position variables for the glow effect
                themeRibbon.style.setProperty('--glow-start-x', `${startX}px`);
                themeRibbon.style.setProperty('--glow-start-y', `${startY}px`);
                themeRibbon.style.setProperty('--glow-end-x', `${endX}px`);
                themeRibbon.style.setProperty('--glow-end-y', `${endY}px`);
                themeRibbon.style.setProperty('--transition-duration', '1.2s');
            }

            // Add transition classes with proper timing
            requestAnimationFrame(() => {
                themeRibbon.classList.add(newSeason === 'dark' ? 'to-dark' : 'to-light');
                themeRibbon.classList.add('theme-transition');

                // Handle logo transition with proper timing
                if (currentLogo) {
                    currentLogo.classList.add('fade-out');
                    currentLogo.classList.remove('active');
                }

                // Delay the new logo appearance to sync with the theme transition
                if (newLogo) {
                    setTimeout(() => {
                        newLogo.classList.add('active');
                    }, 300);
                }

                // Clean up classes after all transitions complete
                setTimeout(() => {
                    themeRibbon.classList.remove('theme-transition', 'to-dark', 'to-light');
                    if (currentLogo) {
                        currentLogo.classList.remove('fade-out');
                    }
                }, 1200);
            });
        }

        // Update theme state
        setSeason(newSeason);
        document.body.className = newSeason;

        // Apply theme-specific styles
        if (newSeason === 'dark') {
            document.documentElement.style.setProperty('--primary-color', '#2196F3');
        } else if (newSeason === 'fall') {
            document.documentElement.style.setProperty('--primary-color', '#FF9800');
        } else {
            document.documentElement.style.setProperty('--primary-color', '#4CAF50');
        }
    };

    const toggleF = (key) => {
        setF((prev) => ({
            ...prev,
            [key]: prev[key] === 'off' ? 'on' : 'off',
        }));
    };

    const toggleV = (key) => {
        setV((prev) => ({
            ...prev,
            [key]: prev[key] === 'off' ? 'on' : 'off',
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
                console.log('New Batch Number:', result.NewBatchNumber);
                setVersion(result.NewBatchNumber); // Update the version state with the new batch number
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
                setVersion(result.max_version); // Update the version state with the max batch number
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
                    selectedVersions: selectedVersions.length > 0 ? selectedVersions : [version],
                    selectedV: V,
                    selectedF: F,
                    selectedCalculationOption,
                    targetRow: target_row,
                    senParameters: S,
                }),
            });

            if (selectedCalculationOption === 'calculateForPrice') {
                // Handle dynamic streaming of prices for each version
                selectedVersions.forEach((version) => {
                    const eventSource = new EventSource(
                        `http://127.0.0.1:5007/stream_price/${version}`
                    );

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
                    // Process sensitivity results if they exist
                    if (Object.keys(S).some(key => S[key].enabled)) {
                        const vizResponse = await fetch('http://127.0.0.1:5007/sensitivity/visualization', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                selectedVersions,
                                senParameters: S
                            }),
                        });
                        
                        if (vizResponse.ok) {
                            const vizData = await vizResponse.json();
                            setSensitivityResults(vizData);
                            setShowSensitivityTab(true);
                            setActiveTab('Sensitivity');
                        }
                    }

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
            // Always use current version if no versions selected
            const versions = selectedVersions.length > 0 ? selectedVersions : [version];
            
            // Ensure current version is included
            if (!versions.includes(version)) {
                versions.push(version);
            }

            const response = await fetch('http://127.0.0.1:5008/generate_png_plots', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectedVersions: versions,
                    selectedProperties: selectedProperties || [], // Ensure array even if empty
                    remarks,
                    customizedFeatures,
                    S: {} // Empty sensitivity params for now
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Wait a bit for plots to be generated
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Trigger a refresh of the plots
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

    const handleRunSub = async () => {
        setAnalysisRunning(true);
        try {
            const response = await fetch('http://127.0.0.1:5009/runSub', {
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

    const handleSubmitCompleteSet = async () => {
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

        const match = normalizedPath.match(
            /Batch\((\d+)\)\/Results\(\d+\)\/([^\/]+)\/([^\/]+\.html)$/
        );
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
                <div key={index} className={`html-content ${iframesLoaded[index] ? 'loaded' : ''}`}>
                    <iframe
                        src={htmlUrl}
                        title={html.name}
                        width="100%"
                        height="600px"
                        style={{ margin: '10px' }}
                        onLoad={() => {
                            setIframesLoaded((prev) => ({ ...prev, [index]: true }));
                        }}
                        className={iframesLoaded[index] ? 'loaded' : ''}
                    />
                </div>
            );
        });
    };

    const renderCase2Content = () => {
        if (!albumHtmls || Object.keys(albumHtmls).length === 0)
            return <div>No HTML files available</div>;

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
                    <TabPanel key={album}>{renderHtmlContent()}</TabPanel>
                ))}
            </Tabs>
        );
    };

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

        // Extract version and album from the normalized path
        const match = normalizedPath.match(
            /Batch\((\d+)\)\/Results\(\d+\)\/([^\/]+)\/([^\/]+\.png)$/
        );

        if (match) {
            const version = match[1];
            const album = match[2];
            const fileName = match[3];
            // Use the PNG server's image endpoint
            return `http://localhost:5008/images/Batch(${version})/Results(${version})/${album}/${fileName}`;
        }
        return normalizedPath;
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
                <div key={index} className={`plot-content ${imagesLoaded[index] ? 'loaded' : ''}`}>
                    <CustomizableImage
                        src={imageUrl}
                        alt={image.name}
                        width="600"
                        height="400"
                        style={{ margin: '10px' }}
                        onLoad={() => {
                            setImagesLoaded((prev) => ({ ...prev, [index]: true }));
                        }}
                        className={imagesLoaded[index] ? 'loaded' : ''}
                    />
                </div>
            );
        });
    };

    const renderCase3Content = () => {
        if (!albumImages || Object.keys(albumImages).length === 0)
            return <div>No PNG files available</div>;

        return (
            <Tabs
                selectedIndex={Object.keys(albumImages).indexOf(selectedAlbum)}
                onSelect={(index) => setSelectedAlbum(Object.keys(albumImages)[index])}
            >
                <TabList>
                    {Object.keys(albumImages).map((album) => (
                        <Tab key={album}>{transformAlbumNamePlot(album)}</Tab>
                    ))}
                </TabList>
                {Object.keys(albumImages).map((album) => (
                    <TabPanel key={album}>{renderPlotContent1()}</TabPanel>
                ))}
            </Tabs>
        );
    };

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
            const fileNames = csvFiles.map((file) => file.name);
            if (!fileNames.includes(subTab)) {
                setSubTab(fileNames[0]); // Set to the first available file if not in list
            }
        }
    }, [csvFiles, subTab]);

    const handleVersionChange = (event) => {
        setVersion(event.target.value);
    };

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
            [`Variable_Table(${version}).csv`]: 'Variable Table',
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
            .filter((file) => !exclusionArray.includes(file.name)) // Filter out excluded files
            .sort((a, b) => a.name.localeCompare(b.name)); // Sort files alphabetically

        return (
            <Tabs
                selectedIndex={sortedCsvFiles.findIndex((file) => file.name === subTab)}
                onSelect={(index) => setSubTab(sortedCsvFiles[index]?.name || '')}
            >
                <TabList>
                    {sortedCsvFiles.map((file) => (
                        <Tab key={file.name}>
                            {nameMapping[file.name] || file.name.replace(`(${version})`, '')}{' '}
                            {/* Use mapped name or fallback to filename without version */}
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

    const renderForm = () => (
        <div className="form-container">
            <div className="sub-tab-buttons">
                <button
                    className={`sub-tab-button ${activeSubTab === 'ProjectConfig' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('ProjectConfig')}
                >
                    Project Configuration
                </button>
                <button
                    className={`sub-tab-button ${activeSubTab === 'LoanConfig' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('LoanConfig')}
                >
                    Loan Configuration
                </button>
                <button
                    className={`sub-tab-button ${activeSubTab === 'RatesConfig' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('RatesConfig')}
                >
                    Rates & Fixed Costs
                </button>
                <button
                    className={`sub-tab-button ${activeSubTab === 'Process1Config' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('Process1Config')}
                >
                    Process Quantities (Vs, units)
                </button>
                <button
                    className={`sub-tab-button ${activeSubTab === 'Process2Config' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('Process2Config')}
                >
                    Process Costs <br /> (Vs, $ / unit)
                </button>
            </div>
            <div className="form-content">
                {activeSubTab && (
                    <>
                        <FormHeader
                            onSensitivityClick={() => {
                                const sKey = `S${activeSubTab === 'ProjectConfig' ? '10' : 
                                            activeSubTab === 'LoanConfig' ? '20' : 
                                            activeSubTab === 'RatesConfig' ? '30' : 
                                            activeSubTab === 'Process1Config' ? '40' : '50'}`;
                                setS(prev => ({
                                    ...prev,
                                    [sKey]: {
                                        ...prev[sKey],
                                        enabled: true,
                                        mode: 'symmetrical'
                                    }
                                }));
                            }}
                            onEfficacyPeriodClick={(e) => {
                                const rect = e.target.getBoundingClientRect();
                                setPopupPosition({
                                    top: rect.top + window.scrollY,
                                    left: rect.left + rect.width
                                });
                                setShowPopup(true);
                            }}
                            onFactualPrecedenceClick={() => {}}
                        />
                        {showPopup && (
                            <Popup
                                show={showPopup}
                                onClose={() => setShowPopup(false)}
                                formValues={formValues}
                                handleInputChange={handleInputChange}
                                id={activeSubTab}
                                version={version}
                                itemId={activeSubTab}
                            />
                        )}
                    </>
                )}
                {activeSubTab === 'ProjectConfig' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount1"
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}
                {activeSubTab === 'LoanConfig' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount2"
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}
                {activeSubTab === 'RatesConfig' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount3"
                        F={F}
                        setF={setF}
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}
                {activeSubTab === 'Process1Config' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount4"
                        V={V}
                        setV={setV}
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}
                {activeSubTab === 'Process2Config' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount5"
                        V={V}
                        setV={setV}
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}

                <div className="form-action-buttons">
                    <div className="button-row config-row">
                        <div className="tooltip-container">
                            <button
                                type="button"
                                onClick={() => loadConfiguration(version)}
                                className="form-action-button load-config"
                            >
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

                    <div className="button-row visualization-row">
                        <div className="tooltip-container">
                            <button
                                onClick={handleRunPNG}
                                className="form-action-button generate-png"
                            >
                                Generate PNG Plots
                            </button>
                            <span className="tooltip1">
                                Choose the attributes thou wishest to grace the legend, and with a
                                click, summon forth the PNG plots.
                            </span>
                        </div>
                        <div className="tooltip-container">
                            <button
                                type="button"
                                onClick={handleRunSub}
                                className="form-action-button generate-dynamic"
                            >
                                Generate Dynamic Plots
                            </button>
                            <span className="tooltip1">
                                Seize the power of efficacy to tailor thy analysis, then click to
                                conjure dynamic plots.
                            </span>
                        </div>
                    </div>

                    <div className="button-row practical-row">
                        <div className="tooltip-container">
                            <button
                                onClick={createNewBatch}
                                disabled={batchRunning}
                                className="form-action-button create-batch"
                            >
                                Create New Batch
                            </button>
                        </div>
                        <div className="tooltip-container">
                            <button
                                onClick={RemoveBatch}
                                className="form-action-button remove-batch"
                            >
                                Remove Batch
                            </button>
                        </div>
                        <div className="tooltip-container">
                            <button
                                onClick={handleRun}
                                className="form-action-button run-cfa"
                                disabled={analysisRunning}
                            >
                                {analysisRunning ? 'Running CFA...' : 'Run CFA'}
                            </button>
                            <span className="tooltip1">
                                <p className="left-aligned-text">
                                    Engage the button to unleash a thorough cash flow analysis:
                                    Cumulative cash flows • Annual revenues • Operating expenses •
                                    Loan repayment terms • Depreciation schedules • State taxes •
                                    Federal taxes • Annual cash flows
                                </p>
                            </span>
                        </div>
                        <div className="tooltip-container">
                            <button
                                onClick={handleSubmitCompleteSet}
                                className="form-action-button submit-set"
                            >
                                Submit Complete Set
                            </button>
                        </div>
                        <div className="tooltip-container">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="form-action-button reset"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
                <div className="calculation-options">
                    <div className="calculation-row">
                        <div className="calculation-input-group">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="calculationOption"
                                    value="freeFlowNPV"
                                    checked={selectedCalculationOption === 'freeFlowNPV'}
                                    onChange={handleOptionChange}
                                />
                                Free Flow NPV
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="calculationOption"
                                    value="calculateForPrice"
                                    checked={selectedCalculationOption === 'calculateForPrice'}
                                    onChange={handleOptionChange}
                                />
                                Calculate for Price, Zeroing NPV at Year
                                {selectedCalculationOption === 'calculateForPrice' && (
                                    <div className="target-row-container">
                                        <input
                                            type="number"
                                            className="target-row-input"
                                            placeholder="Enter Year"
                                            value={target_row}
                                            onChange={handleTargetRowChange}
                                        />
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>
                    <div className="property-selector-container">
                        <PropertySelector
                            selectedProperties={selectedProperties}
                            setSelectedProperties={setSelectedProperties}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

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
                return (
                    <ExtendedScaling
                        baseCosts={baseCosts}
                        onScaledValuesChange={handleScaledValuesChange}
                        initialScalingGroups={scalingGroups}
                        onScalingGroupsChange={handleScalingGroupsChange}
                    />
                );
            case 'Editable':
                return (
                    <div className="p-4">
                        <Tabs>
                            <TabList>
                                <Tab>Outline</Tab>
                                <Tab>Todo List</Tab>
                            </TabList>
                            <TabPanel>
                                <h2 className="text-xl font-bold mb-4">Editable Hierarchical List</h2>
                                <EditableHierarchicalList />
                            </TabPanel>
                            <TabPanel>
                                <h2 className="text-xl font-bold mb-4">Todo List</h2>
                                <TodoList />
                            </TabPanel>
                        </Tabs>
                    </div>
                );
            case 'Sensitivity':
                return renderSensitivityContent();
            default:
                return null;
        }
    };

    // Add sensitivity results rendering function
    const renderSensitivityContent = () => {
        if (!sensitivityResults || Object.keys(sensitivityResults).length === 0) {
            return <div>No sensitivity analysis results available</div>;
        }

        return (
            <div className="sensitivity-results">
                <h2>Sensitivity Analysis Results</h2>
                {Object.entries(sensitivityResults.parameters || {}).map(([paramId, param]) => (
                    <div key={paramId} className="sensitivity-parameter-section">
                        <h3>Parameter: {paramId}</h3>
                        <div className="sensitivity-plots-grid">
                            {sensitivityResults.plots[paramId] && 
                             Object.entries(sensitivityResults.plots[paramId]).map(([plotType, plotPath]) => (
                                <div key={plotType} className="sensitivity-plot">
                                    <h4>{plotType.charAt(0).toUpperCase() + plotType.slice(1)} Plot</h4>
                                    <img 
                                        src={`http://localhost:5007/sensitivity/plots/${plotPath}`}
                                        alt={`${plotType} plot for ${paramId}`}
                                        style={{ maxWidth: '100%', height: 'auto' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="L_1_HomePage">
            <div className="L_1_HomePageSectionA">
                <div className="about-us-image1"></div>
                <div className="L_1_HomePageSectionT">
                    <h2 className="h2-large">TEA Space</h2>
                    <h2 className="h2-small">Techno-Economic-Social Simulation and Dynamic Modeling</h2>
                    <h2 className="h2-small">From lemonad stand to Tesla, TEA Space accomodates your complex cost modeling scenarios</h2>
                    <h2 className="h2-small">Grand opening April 15th 2025</h2>
                </div>
                <div className="theme-ribbon">
                    <div className="logo-container"></div>
                    <div className="theme-buttons">
                        <button
                            className={`theme-button ${season === 'fall' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('fall')}
                        >
                            Creative
                        </button>
                        <button
                            className={`theme-button ${season === 'winter' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('winter')}
                        >
                            Normal
                        </button>
                        <button
                            className={`theme-button ${season === 'dark' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('dark')}
                        >
                            Dark
                        </button>
                    </div>
                </div>
            </div>
            <div className="main-content">
                <nav className="L_1_HomePageTabs">
                    <div>
                        <button
                            className={`tab-button ${activeTab === 'Input' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Input')}
                        >
                            Input
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Case1' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Case1')}
                        >
                            Cash Flow Analysis
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Case2' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Case2')}
                        >
                            Dynamic SubPlots
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Case3' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Case3')}
                        >
                            Plots
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Scaling' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Scaling')}
                        >
                            Scaling
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Editable' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Editable')}
                        >
                            Editable
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'Sensitivity' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Sensitivity')}
                        >
                            Sensitivity Analysis
                        </button>
                    </div>
                </nav>
                {activeTab === 'Input' ? (
                    <div className="form-content">
                        {renderForm()}
                    </div>
                ) : (
                    <div className="content-wrapper">
                        <div className="model-zone">
                            <ModelZone />
                            <div className="model-selection">
                                <VersionSelector />
                                <SpatialTransformComponent />
                            </div>
                        </div>
                        <div className="L_1_HomePageTabContent">
                            {renderTabContent()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const L_1_HomePage = () => {
    return (
        <VersionStateProvider>
            <L_1_HomePageContent />
        </VersionStateProvider>
    );
};

export default L_1_HomePage;
