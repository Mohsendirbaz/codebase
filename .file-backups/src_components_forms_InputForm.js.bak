import React from 'react';
import GeneralFormConfig from '../../GeneralFormConfig';
import PropertySelector from '../../PropertySelector';


const InputForm = ({
    activeSubTab,
    setActiveSubTab,
    formValues,
    handleInputChange,
    version,
    S,
    setS,
    F,
    toggleF,
    V,
    toggleV,
    setVersion,
    handleReset,
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
    selectedProperties,
    setSelectedProperties,
}) => {
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
            </div>
            <div className="form-content">
                <PropertySelector
                    selectedProperties={selectedProperties}
                    setSelectedProperties={setSelectedProperties}
                />
                {activeSubTab === 'ProjectConfig' && (
                    <GeneralFormConfig
                        formValues={formValues}
                        handleInputChange={handleInputChange}
                        version={version}
                        filterKeyword="Amount1"
                        S={S}
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
                        S={S}
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
                        S={S}
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
                        toggleV={toggleV}
                        S={S}
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
                        toggleV={toggleV}
                        S={S}
                        setS={setS}
                        setVersion={setVersion}
                    />
                )}

                <div className="form-action-buttons">
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

                    <div className="button-row practical-row">
                        <div className="tooltip-container">
                            <button
                                onClick={handleRun}
                                style={{
                                    backgroundColor: '#FF5722',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    padding: '10px',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                Run CFA
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
                                style={{
                                    backgroundColor: '#9C27B0',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    padding: '10px',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                Submit Complete Set
                            </button>
                        </div>
                        <div className="tooltip-container">
                            <button
                                type="button"
                                onClick={handleReset}
                                style={{
                                    backgroundColor: '#5C27B0',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    padding: '10px',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
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
                </div>
            </div>
        </div>
    );
};

export default InputForm;
