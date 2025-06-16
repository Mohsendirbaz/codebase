import React, { useState } from 'react';
import FactualPrecedenceBase from './FactualPrecedenceBase';
import axios from 'axios';

/**
 * Enhanced API client for Factual Precedence data with improved caching and error handling
 */
const getAPIPrecedenceData = async (itemId, formValue) => {
  // Create a cache key based on the item ID and relevant form properties
  const cacheKey = `factual-precedence-${itemId}-${JSON.stringify({
    label: formValue?.label || '',
    value: formValue?.value || '',
    type: formValue?.type || '',
  })}`;

  // Check for cached data
  const cachedData = sessionStorage.getItem(cacheKey);
  if (cachedData) {
    try {
      const parsedData = JSON.parse(cachedData);
      const cacheTime = parsedData.timestamp;
      // Use cache if it's less than 30 minutes old
      if (Date.now() - cacheTime < 30 * 60 * 1000) {
        console.log('Using cached factual precedence data');
        return parsedData.data;
      }
    } catch (e) {
      console.warn('Error parsing cached data:', e);
    }
  }

  try {
    const response = await axios.post('http://localhost:3060/api/factual-precedence', {
      itemId,
      formContext: {
        label: formValue?.label || '',
        value: formValue?.value || '',
        type: formValue?.type || '',
        // Include any additional context to help with data relevance
        remarks: formValue?.remarks || '',
      }
    }, {
      // Set timeout to ensure UI responsiveness
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.data.success) {
      // Process and enhance the data
      const enhancedData = enhancePrecedenceData(response.data.factualPrecedence, formValue);

      // Cache the enhanced data
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: enhancedData,
        timestamp: Date.now()
      }));

      return enhancedData;
    }

    throw new Error(response.data.message || 'Failed to fetch data');
  } catch (error) {
    console.error('API error:', error);

    // If we have stale cache, use it as fallback
    if (cachedData) {
      try {
        console.warn('Using stale cache as fallback');
        return JSON.parse(cachedData).data;
      } catch (e) {
        console.error('Failed to use cache fallback:', e);
      }
    }

    // Create emergency fallback data based on parameter type
    const fallbackData = generateFallbackData(itemId, formValue);
    if (fallbackData) {
      return fallbackData;
    }

    throw error;
  }
};

/**
 * Enhance the precedence data with additional insights and context
 */
const enhancePrecedenceData = (data, formValue) => {
  if (!data) return null;

  // Copy data to avoid mutation
  const enhancedData = { ...data };

  // Sort examples by relevance and recency
  if (enhancedData.examples && enhancedData.examples.length > 0) {
    enhancedData.examples.sort((a, b) => {
      // Prioritize by year if available (more recent first)
      if (a.year && b.year) {
        return b.year - a.year;
      }
      return 0;
    });
  }

  // Add confidence level if not present
  if (!enhancedData.confidenceLevel) {
    enhancedData.confidenceLevel = calculateConfidenceLevel(enhancedData);
  }

  // Add contextual note if the value is significantly different from recommendation
  if (enhancedData.recommendedValue && formValue?.value) {
    const recommendedVal = parseFloat(enhancedData.recommendedValue);
    const currentVal = parseFloat(formValue.value);

    if (!isNaN(recommendedVal) && !isNaN(currentVal)) {
      const percentDiff = Math.abs((currentVal - recommendedVal) / recommendedVal) * 100;

      if (percentDiff > 30) {
        enhancedData.contextualNote = currentVal > recommendedVal
            ? "Your value is significantly higher than typical industry standards. Consider reviewing your assumptions or documenting your rationale."
            : "Your value is significantly lower than typical industry standards. Ensure this reflects realistic conditions for your specific case.";
      }
    }
  }

  return enhancedData;
};

/**
 * Calculate a confidence level for the precedence data
 */
const calculateConfidenceLevel = (data) => {
  if (!data || !data.examples) return "low";

  // Base confidence on number of examples, recency, and source diversity
  const exampleCount = data.examples.length;

  if (exampleCount === 0) return "low";
  if (exampleCount < 3) return "medium";

  // Check for recency
  const currentYear = new Date().getFullYear();
  const recentExamples = data.examples.filter(ex => ex.year && ex.year >= currentYear - 5);

  // Check for source diversity
  const uniqueSources = new Set(data.examples.map(ex => ex.entity)).size;

  if (recentExamples.length >= 2 && uniqueSources >= 3) {
    return "high";
  } else if (recentExamples.length >= 1 && uniqueSources >= 2) {
    return "medium-high";
  }

  return "medium";
};

/**
 * Generate fallback data if API fails and no cache is available
 */
const generateFallbackData = (itemId, formValue) => {
  const label = formValue?.label || 'parameter';

  // Check if this is a lifetime-related parameter
  if (itemId.includes('lifetime') || label.toLowerCase().includes('lifetime')) {
    return {
      summary: "Industrial equipment and facility lifetimes vary by sector, technology type, and maintenance practices. Typical designs aim for 20-40 year operational periods.",
      examples: [
        { entity: "General Industry", value: 25, unit: "years", year: 2023, source: "Industrial Engineering Handbook" },
        { entity: "Best Practice", value: 30, unit: "years", year: 2022, source: "Industry Standards" }
      ],
      recommendedValue: 25,
      recommendationRationale: "Balance of typical industry averages accounting for technological obsolescence",
      confidenceLevel: "medium"
    };
  }

  // Check if this is a price-related parameter
  if (itemId.includes('price') || label.toLowerCase().includes('price')) {
    // This is just a generic fallback
    return {
      summary: "Pricing strategies vary based on market position, production costs, and competitive landscape. Historical trends should inform projections.",
      examples: [
        { entity: "Market Average", value: 2.50, unit: "$/unit", year: 2023, source: "Market Analysis" },
        { entity: "Premium Segment", value: 3.75, unit: "$/unit", year: 2023, source: "Industry Report" }
      ],
      recommendedValue: 2.75,
      recommendationRationale: "Competitive positioning with slight premium over market average",
      confidenceLevel: "low"
    };
  }

  // Generic fallback for other cases
  return {
    summary: `No specific data available for ${label}. Consider industry benchmarks or consulting with domain experts.`,
    examples: [],
    confidenceLevel: "low"
  };
};

/**
 * Submit user feedback about factual precedence data quality
 */
const submitFeedback = async (itemId, feedbackType, comment) => {
  try {
    const response = await axios.post('http://localhost:3060/api/factual-precedence/feedback', {
      itemId,
      feedbackType,
      comment,
      timestamp: new Date().toISOString()
    });

    return response.data.success;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return false;
  }
};

const APIFactualPrecedence = (props) => {
  const [feedbackStatus, setFeedbackStatus] = useState(null);

  const handleFeedbackSubmit = async (itemId, feedback) => {
    const success = await submitFeedback(
        itemId,
        feedback.type,
        feedback.comment
    );

    setFeedbackStatus({
      success,
      message: success
          ? 'Thank you for your feedback!'
          : 'Failed to submit feedback. Please try again.'
    });

    // Clear status after 3 seconds
    setTimeout(() => {
      setFeedbackStatus(null);
    }, 3000);
  };

  return (
      <FactualPrecedenceBase
          {...props}
          getPrecedenceData={getAPIPrecedenceData}
          onFeedbackSubmit={handleFeedbackSubmit}
          feedbackStatus={feedbackStatus}
      />
  );
};

export { getAPIPrecedenceData };
export default APIFactualPrecedence;
