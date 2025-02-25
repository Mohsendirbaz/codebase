import React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import ExtendedScaling from '../../ExtendedScaling';
import InputForm from '../forms/InputForm';
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
    version,
    albumHtmls,
    albumImages,
    loadingStates,
    contentLoaded,
    onIframeLoad,
    onImageLoad,
    onError,
    formValues,
    handleInputChange,
    handleReset,
    F,
    toggleF,
    V,
    toggleV,
    setVersion,
    handleRun,
    handleSubmitCompleteSet,
    selectedCalculationOption,
    handleOptionChange,
    target_row,
    handleTargetRowChange,
    remarks,
    toggleRemarks,
    customizedFeatures,
    toggleCustomizedFeatures,
    activeSubTab,
    setActiveSubTab,
    selectedProperties,
    setSelectedProperties,
    S,
    setS
}) => {
    switch (activeTab) {
        case 'Input':
            return (
                <InputForm
                    activeSubTab={activeSubTab}
                    setActiveSubTab={setActiveSubTab}
                    version={version}
                    formValues={formValues}
                    handleInputChange={handleInputChange}
                    handleReset={handleReset}
                    F={F}
                    toggleF={toggleF}
                    V={V}
                    toggleV={toggleV}
                    setVersion={setVersion}
                    handleRun={handleRun}
                    handleSubmitCompleteSet={handleSubmitCompleteSet}
                    selectedCalculationOption={selectedCalculationOption}
                    handleOptionChange={handleOptionChange}
                    target_row={target_row}
                    handleTargetRowChange={handleTargetRowChange}
                    remarks={remarks}
                    toggleRemarks={toggleRemarks}
                    customizedFeatures={customizedFeatures}
                    toggleCustomizedFeatures={toggleCustomizedFeatures}
                    selectedProperties={selectedProperties}
                    setSelectedProperties={setSelectedProperties}
                    S={S}
                    setS={setS}
                />
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
                    version={version}
                />
            );
        case 'Case2':
            return (
                <HtmlContentTab
                    albumHtmls={albumHtmls}
                    onIframeLoad={onIframeLoad}
                    contentLoaded={contentLoaded}
                />
            );
        case 'Case3':
            return (
                <PlotContentTab
                    albumImages={albumImages}
                    onImageLoad={onImageLoad}
                    contentLoaded={contentLoaded}
                />
            );
        case 'Scaling':
            return <ExtendedScaling />;
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
