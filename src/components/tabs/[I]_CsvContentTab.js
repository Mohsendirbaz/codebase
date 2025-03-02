import React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import CustomizableTable from '../../CustomizableTable';

const CsvContentTab = ({ csvFiles, subTab, setSubTab, version }) => {
    // Name mapping for specific files to more presentable names
    const nameMapping = {
        [`CFA(${version}).csv`]: 'Cash Flow Analysis',
        [`Economic_Summary(${version}).csv`]: 'Economic Summary',
        [`Cumulative_Opex_Table_(${version}).csv`]: 'Cumulative Opex Table',
        [`Filtered_Value_Intervals(${version}).csv`]: 'Filtered Value Intervals',
        [`Fixed_Opex_Table_(${version}).csv`]: 'Fixed Opex Table',
        [`Variable_Opex_Table_(${version}).csv`]: 'Variable Opex Table',
        [`Configuration_Matrix(${version}).csv`]: 'Configuration Matrix',
        [`Distance_From_Paying_Taxes(${version}).csv`]: 'Distance from Paying Taxes',
        [`Sorted_Points(${version}).csv`]: 'Sorted Points',
        [`Variable_Table(${version}).csv`]: 'Variable Table',
    };

    // Exclude these files from display
    const exclusionArray = [
        `Configuration_Matrix(${version}).csv`,
        `Distance_From_Paying_Taxes(${version}).csv`,
        `Sorted_Points(${version}).csv`,
        `Fixed_Opex_Table_${version}.csv`,
        `Variable_Opex_Table_${version}.csv`,
        `Filtered_Value_Intervals(${version}).csv`,
    ];

    // Filter and sort the CSV files
    const sortedCsvFiles = [...csvFiles]
        .filter((file) => !exclusionArray.includes(file.name))
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <Tabs
            selectedIndex={sortedCsvFiles.findIndex((file) => file.name === subTab)}
            onSelect={(index) => setSubTab(sortedCsvFiles[index]?.name || '')}
        >
            <TabList>
                {sortedCsvFiles.map((file) => (
                    <Tab key={file.name}>
                        {nameMapping[file.name] || file.name.replace(`(${version})`, '')}
                    </Tab>
                ))}
            </TabList>
            {sortedCsvFiles.map((file) => (
                <TabPanel key={file.name}>
                    <CustomizableTable data={file.data} fileName={file.name} />
                </TabPanel>
            ))}
        </Tabs>
    );
};

export default CsvContentTab;
