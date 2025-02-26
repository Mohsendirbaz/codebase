import React, { useState, useEffect } from 'react';
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
import ActionButtons from '../buttons/ActionButtons';
import ScalingTab from '../scaling/ScalingTab';
import MotionTooltip from '../scaling/MotionTooltip';
import MotionDraggableItem from '../scaling/MotionDraggableIte';
import MotionScalingSummary from '../scaling/MotionScalingSummary';
import { motion, AnimatePresence } from 'framer-motion';

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
    handleRunPNG,
    handleRunSub,
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
    setS,
    analyzingRunning
}) => {
    const [editableTab, setEditableTab] = useState('outline');

    // Process Amount5 values for scaling
    const processedItems = Object.entries(formValues || {})
        .filter(([key]) => key.includes('Amount5'))
        .map(([key, value]) => ({
            id: key,
            label: value.label || key,
            baseValue: parseFloat(value.value) || 0,
            name: value.label || key,
            frozen: false,
            remarks: value.remarks || ''
        }));

    // Initial scaling group with processed items
    const initialScalingGroups = [{
        id: 'default',
        name: 'Default Scaling',
        isProtected: false,
        items: processedItems
    }];

    switch (activeTab) {
        case 'Input':
            return (
                <div>
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
                    <ActionButtons
                        handleRunPNG={handleRunPNG}
                        handleRunSub={handleRunSub}
                        selectedProperties={selectedProperties}
                        remarks={remarks}
                        customizedFeatures={customizedFeatures}
                        version={version}
                        selectedVersions={[version]}
                        analyzingRunning={analyzingRunning}
                    />
                </div>
            );
        case 'ModelZone':
            return (
                <div className="model-zone">
                    <ModelZone />
                    <div className="model-selection">
                        <VersionSelector />
                    </div>
                </div>
            );
        case 'SpatialTransform':
            return <SpatialTransformComponent />;
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
            return (
                <div className="scaling-interface">
                    <ScalingTab
                        TooltipComponent={MotionTooltip}
                        DraggableItemComponent={MotionDraggableItem}
                        SummaryComponent={MotionScalingSummary}
                        AnimatePresence={AnimatePresence}
                        motion={motion}
                        initialItems={processedItems}
                        initialOperations={[]}
                        initialTabConfigs={{
                            showLogarithmic: true,
                            showLinear: true,
                            precision: 2,
                            defaultOperation: 'multiply'
                        }}
                    />
                </div>
            );
        case 'Editable':
            return (
                <div>
                    <div>
                        <button onClick={() => setEditableTab('outline')}>Outline</button>
                        <button onClick={() => setEditableTab('todo')}>Todo List</button>
                    </div>
                    {editableTab === 'outline' ? <EditableHierarchicalList /> : <TodoList />}
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
