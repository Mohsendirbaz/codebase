import React from 'react';
import ThemeSelector from './theme/ThemeSelector';
import './HeaderSection.css';

const HeaderSection = ({ season, handleThemeChange }) => {
  return (
    <div className="L_1_HomePageSectionA">
      <div className="about-us-image1"></div>
      <div className="L_1_HomePageSectionT">
        <h2 className="h2-large">TEA Space</h2>
        <h2 className="h2-small">Techno-Economic-Social Simulation and Dynamic Modeling</h2>
        <h2 className="h2-small">From lemonad stand to Tesla, TEA Space accomodates your complex cost modeling scenarios</h2>
        <h2 className="h2-small">Grand opening April 15th 2025</h2>
      </div>
      <ThemeSelector season={season} handleThemeChange={handleThemeChange} />
    </div>
  );
};

export default HeaderSection;
