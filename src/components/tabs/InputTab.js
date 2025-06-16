import React from 'react';
import GeneralFormConfig from '../../GeneralFormConfig.js';
import '../../styles/HomePage.CSS/HCSS.css';

/**
 * @file InputTab.js
 * @description Input tab component for the HomePage
 * @module components/tabs/InputTab
 * @requires react
 * @requires GeneralFormConfig
 */

/**
 * InputTab Component
 * Renders the input form with sub-tabs for different configuration sections
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formValues - Form values
 * @param {Function} props.handleInputChange - Function to handle input changes
 * @param {string} props.version - Current version
 * @param {Function} props.setVersion - Function to set version
 * @param {Object} props.S - S values
 * @param {Function} props.setS - Function to set S values
 * @param {Object} props.V - V values
 * @param {Function} props.setV - Function to set V values
 * @param {Object} props.R - R values
 * @param {Function} props.setR - Function to set R values
 * @param {Function} props.toggleV - Function to toggle V values
 * @param {Function} props.toggleR - Function to toggle R values
 * @param {Object} props.F - F values
 * @param {Function} props.toggleF - Function to toggle F values
 */
const InputTab = ({
    formValues,
    handleInputChange,
    version,
    setVersion,
    S,
    setS,
    V,
    setV,
    R,
    setR,
    toggleV,
    toggleR,
    F,
    toggleF
}) => {
    const [activeSubTab, setActiveSubTab] = React.useState('ProjectConfig');

    return (
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
                <button
                    className={`sub-tab-button ${activeSubTab === 'Revenue1Config' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('Revenue1Config')}
                >
                    Additional Revenue Streams Quantities<br /> (Rs, units)
                </button>
                <button
                    className={`sub-tab-button ${activeSubTab === 'Revenue2Config' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('Revenue2Config')}
                >
                    Additional Revenue Streams Prices <br /> (Rs, $ / unit)
                </button>
                <button
                    className={`sub-tab-button ${activeSubTab === 'Scaling' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('Scaling')}
                >
                    + Scaling
                </button>
                <button
                    className={`sub-tab-button ${activeSubTab === 'FixedRevenueConfig' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('FixedRevenueConfig')}
                >
                    Fixed Revenue Components <br /> (RFs, $)
                </button>
            </div>
            <div className="form-content">
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
                        toggleF={toggleF}
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}
                {activeSubTab === 'Process1Config' && (
                    <>
                        <GeneralFormConfig
                            formValues={formValues}
                            handleInputChange={handleInputChange}
                            version={version}
                            filterKeyword="Amount4"
                            V={V}
                            setV={setV}
                            R={R}
                            setR={setR}
                            toggleR={toggleR}
                            toggleV={toggleV}
                            S={S || {}}
                            setS={setS}
                            setVersion={setVersion}
                        />
                    </>
                )}
                {activeSubTab === 'Process2Config' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount5"
                        V={V}
                        setV={setV}
                        R={R}
                        setR={setR}
                        toggleR={toggleR}
                        toggleV={toggleV}
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}
                {activeSubTab === 'Revenue1Config' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount6"
                        V={V}
                        setV={setV}
                        R={R}
                        setR={setR}
                        toggleR={toggleR}
                        toggleV={toggleV}
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}
                {activeSubTab === 'Revenue2Config' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount7"
                        V={V}
                        setV={setV}
                        R={R}
                        setR={setR}
                        toggleR={toggleR}
                        toggleV={toggleV}
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}
                {activeSubTab === 'Scaling' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount8"
                        V={V}
                        setV={setV}
                        R={R}
                        setR={setR}
                        toggleR={toggleR}
                        toggleV={toggleV}
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}
                {activeSubTab === 'FixedRevenueConfig' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount9"
                        V={V}
                        setV={setV}
                        R={R}
                        setR={setR}
                        toggleR={toggleR}
                        toggleV={toggleV}
                        S={S || {}}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}
            </div>
        </div>
    );
};

export default InputTab;