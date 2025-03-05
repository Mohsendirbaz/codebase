import React from 'react';
import PropTypes from 'prop-types';
import propertyMapping from './useFormValues.js';  // Correctly importing propertyMapping

const CustomizableTable = ({
  data,
  fileName,
  columns,
  renderCell,
  tableClassName,
  headerClassName,
  rowClassName,
  cellClassName,
  numberFormatOptions,
}) => {
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  // Define the desired header order for CFA
  const desiredHeaderOrderCFA7 = [
    'Year',
    'Revenue',
    'Operating Expenses',
    'Loan',
    'Federal Taxes',
    'State Taxes',
    'Depreciation',
    'After-Tax Cash Flow',
    'Discounted Cash Flow',
    'Cumulative Cash Flow'
  ];

  // Define the desired header order for Filtered_Value_Intervals
  const desiredHeaderOrderFilteredValueIntervals = [
    'ID',
    'Start',
    'End',
    'Value',
    'Remarks'
  ];

  // Get headers from the columns or the data keys
  let headers = columns || Object.keys(data[0]);

  // Check if the fileName is 'CFA' or 'Filtered_Value_Intervals' to determine if headers should be reordered and reversed
  if (fileName && fileName.startsWith('CFA')) {
    headers = desiredHeaderOrderCFA7;
  } else if (fileName && fileName.startsWith('Filtered_Value_Intervals')) {
    headers = desiredHeaderOrderFilteredValueIntervals;
  } else {
    // Otherwise, just sort headers alphabetically or as they appear naturally
    headers = headers.sort((a, b) => a.localeCompare(b));
  }

  // Format numbers based on the provided options or default behavior
  const formatNumber = (value) => {
    if (typeof value !== 'number') return value;

    // Create a formatter with 3 decimal places for numbers between 0 and 1
    const threeDecimalFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

    const numberFormatter = new Intl.NumberFormat('en-US', numberFormatOptions);

    let formattedValue = numberFormatter.format(value);
    let style = {};

    // Conditional formatting for numbers < 1 and >= 0
    if (value >= 0 && value < 1) {
      formattedValue = threeDecimalFormatter.format(value);
    }

    if (value < 0) {
      style.color = 'red';
    }

    if (value >= 1_000_000_000 || value <= -1_000_000_000) {
      style.fontWeight = 'bold';
      style.fontStyle = 'italic';
    }

    return (
      <span style={style}>
        {formattedValue}
      </span>
    );
  };

  return (
    <table className={`custom-table ${tableClassName}`}>
      <thead>
  <tr>
    {headers.map((header) => (
      <th
        key={header}
        className={`custom-header ${headerClassName}`}
        style={{ width: '200px', textAlign: 'center' }}
      >
        <span style={{ position: 'relative', cursor: 'pointer' }}>
          {header}
          <span className="tooltip2">hi</span> {/* Tooltip Element */}
        </span>
      </th>
    ))}
  </tr>
</thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex} className={`custom-row ${rowClassName}`}>
            {headers.map((header) => (
              <td key={`${rowIndex}-${header}`} className={`custom-cell ${cellClassName}`} style={{ padding: '8px !important', textAlign: 'left', paddingLeft: '10px' }}>
                {header === 'ID' && fileName.startsWith('Filtered_Value_Intervals')
                  ? propertyMapping[row[header]] || row[header]  // Apply mapping for IDs in Filtered_Value_Intervals
                  : renderCell
                    ? renderCell(row[header], header, row)
                    : formatNumber(row[header])
                }
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

CustomizableTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  fileName: PropTypes.string.isRequired,
  columns: PropTypes.arrayOf(PropTypes.string),
  renderCell: PropTypes.func,
  tableClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  rowClassName: PropTypes.string,
  cellClassName: PropTypes.string,
  numberFormatOptions: PropTypes.object,
};

CustomizableTable.defaultProps = {
  columns: null,
  renderCell: null,
  tableClassName: '',
  headerClassName: '',
  rowClassName: '',
  cellClassName: '',
  numberFormatOptions: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
};

export default CustomizableTable;
