import React from 'react';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import CustomizableTable from '../../components/modules/CustomizableTable';
import '../../styles/HomePage.CSS/HCSS.css';
import '../../styles/HomePage.CSS/CustomizableTable.css';

/**
 * @file ResultsTab.js
 * @description Results tab component for the HomePage
 * @module components/tabs/ResultsTab
 * @requires react
 * @requires react-tabs
 * @requires CustomizableTable
 */

/**
 * ResultsTab Component
 * Renders the results content based on the specified tab type
 * 
 * @param {Object} props - Component props
 * @param {string} props.tabType - Type of tab to render ('Case1', 'Case2', or 'Case3')
 * @param {Array} props.htmlContent - HTML content for Case2 tab
 * @param {Array} props.plotContent - Plot content for Case3 tab
 * @param {Array} props.csvFiles - CSV files for Case1 tab
 * @param {Array} props.yearColumnsToHighlight - Year columns to highlight in tables
 * @param {boolean} props.isLoading - Whether content is loading
 */
const ResultsTab = ({
    tabType,
    htmlContent = [],
    plotContent = [],
    csvFiles = [],
    yearColumnsToHighlight = [],
    isLoading = false
}) => {
    // Render Case1 content (Cash Flow Analysis)
    const renderCase1Content = () => {
        if (isLoading) {
            return <div className="loading-indicator">Loading CSV data...</div>;
        }

        if (!csvFiles || csvFiles.length === 0) {
            return <div className="no-data-message">No CSV data available.</div>;
        }

        return (
            <div className="csv-container">
                <Tabs>
                    <TabList>
                        {csvFiles.map((file, index) => (
                            <Tab key={file.name || index}>{file.name || `File ${index + 1}`}</Tab>
                        ))}
                    </TabList>
                    {csvFiles.map((file) => (
                        <TabPanel key={file.name}>
                            <CustomizableTable 
                                data={file.data} 
                                fileName={file.name} 
                                yearColumnsToHighlight={yearColumnsToHighlight}
                            />
                        </TabPanel>
                    ))}
                </Tabs>
            </div>
        );
    };

    // Render Case2 content (Dynamic SubPlots)
    const renderCase2Content = () => {
        if (isLoading) {
            return <div className="loading-indicator">Loading HTML content...</div>;
        }

        if (!htmlContent || htmlContent.length === 0) {
            return <div className="no-data-message">No HTML content available.</div>;
        }

        const renderHtmlContent = () => (
            <div 
                className="html-content"
                dangerouslySetInnerHTML={{ __html: htmlContent.join('') }}
            />
        );

        return (
            <div className="html-container">
                <Tabs>
                    <TabList>
                        {htmlContent.map((_, index) => (
                            <Tab key={index}>Album {index + 1}</Tab>
                        ))}
                    </TabList>
                    {htmlContent.map((album) => (
                        <TabPanel key={album}>{renderHtmlContent()}</TabPanel>
                    ))}
                </Tabs>
            </div>
        );
    };

    // Render Case3 content (Plots)
    const renderCase3Content = () => {
        if (isLoading) {
            return <div className="loading-indicator">Loading plot content...</div>;
        }

        if (!plotContent || plotContent.length === 0) {
            return <div className="no-data-message">No plot content available.</div>;
        }

        const renderPlotContent = () => (
            <div 
                className="plot-content"
                dangerouslySetInnerHTML={{ __html: plotContent.join('') }}
            />
        );

        return (
            <div className="plot-container">
                <Tabs>
                    <TabList>
                        {plotContent.map((_, index) => (
                            <Tab key={index}>Plot {index + 1}</Tab>
                        ))}
                    </TabList>
                    {plotContent.map((album) => (
                        <TabPanel key={album}>{renderPlotContent()}</TabPanel>
                    ))}
                </Tabs>
            </div>
        );
    };

    // Render the appropriate content based on tabType
    const renderContent = () => {
        switch (tabType) {
            case 'Case1':
                return renderCase1Content();
            case 'Case2':
                return renderCase2Content();
            case 'Case3':
                return renderCase3Content();
            default:
                return <div>Please select a valid tab type.</div>;
        }
    };

    return (
        <div className="results-tab-container">
            {renderContent()}
        </div>
    );
};

export default ResultsTab;