import { useState } from 'react';

/**
 * @typedef {Object} FormValue
 * @property {number|string} value - The value of the form field
 * @property {string} [remarks] - Optional remarks for the field
 * @property {Object} [efficacyPeriod] - Optional efficacy period settings
 * @property {Object} [senParam] - Optional sensitivity parameter settings
 */

/**
 * @typedef {Object.<string, FormValue>} FormValues
 */

/**
 * Custom hook for managing form values with support for remarks and efficacy periods
 * @returns {Object} Form values and handlers
 * @property {FormValues} formValues - The current form values
 * @property {function} handleInputChange - Handler for input changes
 * @property {function} handleReset - Handler for resetting the form
 * @property {function} setFormValues - Setter for form values
 */
const useFormValues = () => {
    const [formValues, setFormValues] = useState({});

    /**
     * Handle changes to form inputs
     * @param {string} id - The ID of the form field
     * @param {Object} changes - The changes to apply
     * @param {number|string} [changes.value] - The new value
     * @param {string} [changes.remarks] - The new remarks
     * @param {Object} [changes.efficacyPeriod] - The new efficacy period
     * @param {Object} [changes.senParam] - The new sensitivity parameter
     */
    const handleInputChange = (id, changes) => {
        setFormValues((prevValues) => ({
            ...prevValues,
            [id]: {
                ...prevValues[id],
                ...changes,
            },
        }));
    };

    /**
     * Reset all form values to their initial state
     */
    const handleReset = () => {
        setFormValues({});
    };

    return {
        formValues,
        handleInputChange,
        handleReset,
        setFormValues,
    };
};

export default useFormValues;
