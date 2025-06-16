import React from 'react';

/**
 * DecarbonizationTargetTimeline - Timeline visualization for pathway readiness
 * 
 * @param {Object} props - Component props
 * @param {String} props.maturityLevel - Maturity level of the pathway
 * @param {Number} props.readinessYear - Year when the pathway will be commercially ready
 */
const DecarbonizationTargetTimeline = ({
  maturityLevel,
  readinessYear
}) => {
  // Define maturity levels and their order
  const maturityLevels = [
    'research',
    'pilot',
    'demonstration',
    'early-commercial',
    'commercial',
    'mature'
  ];
  
  // Calculate maturity index
  const maturityIndex = maturityLevels.indexOf(maturityLevel);
  const progress = maturityIndex >= 0 ? (maturityIndex / (maturityLevels.length - 1)) * 100 : 0;
  
  // Current year and target years
  const currentYear = new Date().getFullYear();
  const years = [2020, 2025, 2030, 2035, 2040, 2050];
  
  return (
    <div className="decarbonization-timeline">
      <div className="timeline-maturity">
        <div className="maturity-label">
          Technology Maturity: <span className={`maturity-value ${maturityLevel}`}>{maturityLevel}</span>
        </div>
        <div className="maturity-progress-bar">
          <div className="maturity-progress-fill" style={{ width: `${progress}%` }}></div>
          <div className="maturity-markers">
            {maturityLevels.map((level, index) => (
              <div 
                key={level}
                className={`maturity-marker ${level === maturityLevel ? 'active' : ''}`}
                style={{ left: `${(index / (maturityLevels.length - 1)) * 100}%` }}
              >
                <div className="marker-dot"></div>
                <div className="marker-label">{level}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {readinessYear && (
        <div className="timeline-years">
          <div className="years-label">
            Commercial Readiness: <span className="year-value">{readinessYear}</span>
          </div>
          <div className="years-progress-bar">
            <div 
              className="years-progress-fill"
              style={{ 
                width: `${Math.max(0, Math.min(100, ((readinessYear - 2020) / 30) * 100))}%` 
              }}
            ></div>
            <div className="year-markers">
              {years.map(year => (
                <div 
                  key={year}
                  className={`year-marker ${year === readinessYear ? 'active' : ''} ${year < currentYear ? 'past' : 'future'}`}
                  style={{ left: `${((year - 2020) / 30) * 100}%` }}
                >
                  <div className="marker-dot"></div>
                  <div className="marker-label">{year}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="timeline-targets">
        <div className="target-marker" style={{ left: '33%' }}>
          <div className="target-line"></div>
          <div className="target-label">2030 Target</div>
          <div className="target-description">30% emissions reduction</div>
        </div>
        <div className="target-marker" style={{ left: '83%' }}>
          <div className="target-line"></div>
          <div className="target-label">2050 Target</div>
          <div className="target-description">Net Zero Emissions</div>
        </div>
      </div>
    </div>
  );
};

export default DecarbonizationTargetTimeline;