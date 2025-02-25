import React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import ExtendedScaling from '../../ExtendedScaling';
import ModelZone from '../model/ModelZone';
import VersionSelector from '../../VersionSelector';
import SpatialTransformComponent from '../../naturalmotion';
import SensitivityAnalysis from '../SensitivityAnalysis';
import TestingZone from '../TestingZone';
import EditableHierarchicalList from '../../Editable';
import TodoList from '../../TodoList';
import CsvContentTab from './CsvContentTab';
import HtmlContentTab from './HtmlContentTab';
import PlotContentTab from './PlotContentTab';

const TabContent = ({
    activeTab,
    csvFiles,
    subTab,
    setSubTab,
    version,
    albumHtmls,
    selectedHtml,
    setSelectedHtml,
    iframesLoaded,
    setIframesLoaded,
    albumImages,
    selectedAlbum,
    setSelectedAlbum,
    imagesLoaded,
    setImagesLoaded,
    baseCosts,
    handleScaledValuesChange,
    scalingGroups,
    handleScalingGroupsChange,
    renderForm
}) => {
    switch (activeTab) {
        case 'Input':
            return (
                <div className="form-content">
                    {renderForm()}
                </div>
            );
        case 'ModelZone':
            return (
                <div className="model-zone">
                    <ModelZone />
                    <div className="model-selection">
                        <VersionSelector />
                        <SpatialTransformComponent />
                    </div>
                </div>
            );
        case 'Case1':
            return (
                <CsvContentTab
                    csvFiles={csvFiles}
                    subTab={subTab}
                    setSubTab={setSubTab}
                    version={version}
                />
            );
        case 'Case2':
            return (
                <HtmlContentTab
                    albumHtmls={albumHtmls}
                    selectedHtml={selectedHtml}
                    setSelectedHtml={setSelectedHtml}
                    iframesLoaded={iframesLoaded}
                    setIframesLoaded={setIframesLoaded}
                />
            );
        case 'Case3':
            return (
                <PlotContentTab
                    albumImages={albumImages}
                    selectedAlbum={selectedAlbum}
                    setSelectedAlbum={setSelectedAlbum}
                    imagesLoaded={imagesLoaded}
                    setImagesLoaded={setImagesLoaded}
                />
            );
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
        case 'SensitivityAnalysis':
            return <SensitivityAnalysis />;
        case 'TestingZone':
            return <TestingZone />;
        default:
            return null;
    }
};

export default TabContent;
