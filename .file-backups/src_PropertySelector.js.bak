import React from 'react';
import useFormValues from './useFormValues';

const PropertySelector = ({ selectedProperties, setSelectedProperties }) => {
  const { formValues } = useFormValues();

  const handlePropertyChange = (event) => {
    const selectedOptions = Array.from(event.target.selectedOptions, (option) => option.value);
    const originalProperties = selectedOptions.map(displayProp => Object.keys(formValues).find(key => formValues[key].label === displayProp));
    setSelectedProperties(originalProperties);
  };

  return (
    <div className="version-selector-container">
      <label htmlFor="property-selector" className="label-common"></label>
      <select
        id="property-selector"
        multiple
        value={selectedProperties.map(prop => formValues[prop].label)}
        onChange={handlePropertyChange}
        className="form-item"
      >
        {Object.keys(formValues).map((key) => (
          <option key={key} value={formValues[key].label}>
            {formValues[key].label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PropertySelector;
