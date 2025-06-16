import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import '../styles/ScalingGroupsPreview.css';

/**
 * ScalingGroupsPreview - A component for displaying scaling groups with horizontal switching
 * 
 * @param {Object} props - Component props
 * @param {Array} props.scalingGroups - The scaling groups to display
 */
const ScalingGroupsPreview = ({ scalingGroups = [] }) => {
  const [selectedGroup, setSelectedGroup] = useState(0);

  // If there are no scaling groups, display a message
  if (!scalingGroups || scalingGroups.length === 0) {
    return <div className="no-scaling-groups">No scaling groups available</div>;
  }

  // Handle navigation to previous group
  const goToPreviousGroup = () => {
    setSelectedGroup((prev) => (prev > 0 ? prev - 1 : prev));
  };

  // Handle navigation to next group
  const goToNextGroup = () => {
    setSelectedGroup((prev) => (prev < scalingGroups.length - 1 ? prev + 1 : prev));
  };

  return (
    <div className="scaling-groups-preview">
      <div className="scaling-groups-navigation">
        <button 
          className="nav-button prev"
          onClick={goToPreviousGroup}
          disabled={selectedGroup === 0}
          aria-label="Previous scaling group"
        >
          <ChevronLeftIcon className="nav-icon" />
        </button>

        <Tab.Group selectedIndex={selectedGroup} onChange={setSelectedGroup}>
          <Tab.List className="scaling-groups-tabs">
            {scalingGroups.map((group, index) => (
              <Tab
                key={group.id || index}
                className={({ selected }) =>
                  `scaling-group-tab ${selected ? 'scaling-group-tab-selected' : ''}`
                }
              >
                {group.name || `Group ${index + 1}`}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="scaling-groups-panels">
            {scalingGroups.map((group, groupIndex) => (
              <Tab.Panel key={group.id || groupIndex} className="scaling-group-panel">
                <div className="scaling-group-details">
                  <h4 className="scaling-group-name">
                    {group.name || `Group ${groupIndex + 1}`}
                  </h4>

                  <div className="scaling-group-items">
                    {group.items && group.items.length > 0 ? (
                      <ul className="items-list">
                        {group.items.map((item, itemIndex) => (
                          <li key={item.id || itemIndex} className="scaling-item">
                            <span className="item-label">
                              {item.label || `Item ${itemIndex + 1}`}
                            </span>
                            <div className="item-operation">
                              <span className="operation-name">
                                {item.operation || 'multiply'}
                              </span>
                              <span className="operation-factor">
                                {item.scalingFactor || 1}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-items">No items in this group</p>
                    )}
                  </div>
                </div>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>

        <button 
          className="nav-button next"
          onClick={goToNextGroup}
          disabled={selectedGroup === scalingGroups.length - 1}
          aria-label="Next scaling group"
        >
          <ChevronRightIcon className="nav-icon" />
        </button>
      </div>

      <div className="scaling-groups-indicator">
        <span className="current-group">{selectedGroup + 1}</span>
        <span className="total-groups">/ {scalingGroups.length}</span>
      </div>
    </div>
  );
};

export default ScalingGroupsPreview;
