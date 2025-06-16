import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/HomePage.CSS/HCSS.css';

// Local storage keys
const FACT_STORAGE_KEY = 'teaSpaceFacts';
const FACT_COLLAPSED_KEY = 'factEngineCollapsed';

const FactEngine = () => {
  const [facts, setFacts] = useState([]);
  const [currentFact, setCurrentFact] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem(FACT_COLLAPSED_KEY) === 'true'
  );
  const [isNewFact, setIsNewFact] = useState(false);

  // Load facts from localStorage or initial data file
  useEffect(() => {
    const loadFacts = async () => {
      try {
        // Check if we have facts in localStorage
        const storedFactsJSON = localStorage.getItem(FACT_STORAGE_KEY);

        if (storedFactsJSON) {
          const storedFacts = JSON.parse(storedFactsJSON);
          setFacts(storedFacts);
        } else {
          // If not in localStorage, load from initial data file
          const response = await fetch('/src/data/teaSpaceFacts.json');
          const initialFacts = await response.json();
          setFacts(initialFacts);

          // Save initial facts to localStorage
          localStorage.setItem(FACT_STORAGE_KEY, JSON.stringify(initialFacts));
        }
      } catch (error) {
        console.error('Error loading facts:', error);
        // Fallback to hardcoded facts if fetch fails
        const fallbackFacts = [
          {
            id: 1,
            text: "Financially literate people are less likely to get cheated",
            agrees: 0,
            isPinned: false
          },
          {
            id: 2,
            text: "Higher mathematical skills translates to higher incomes",
            agrees: 0,
            isPinned: false
          }
        ];
        setFacts(fallbackFacts);
        localStorage.setItem(FACT_STORAGE_KEY, JSON.stringify(fallbackFacts));
      }
    };

    loadFacts();
  }, []);

  // If facts change, update localStorage
  useEffect(() => {
    if (facts.length > 0) {
      localStorage.setItem(FACT_STORAGE_KEY, JSON.stringify(facts));
    }
  }, [facts]);

  // When facts are loaded, select a random unpinned fact
  useEffect(() => {
    if (facts.length > 0 && !currentFact) {
      generateRandomFact();
    }
  }, [facts]);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(FACT_COLLAPSED_KEY, isCollapsed);
  }, [isCollapsed]);

  // Generate a random fact that's not pinned
  const generateRandomFact = useCallback(() => {
    // Filter out pinned facts to ensure we only show unpinned ones
    const unpinnedFacts = facts.filter(fact => !fact.isPinned);

    if (unpinnedFacts.length === 0) {
      // If all facts are pinned, use all facts
      const randomIndex = Math.floor(Math.random() * facts.length);
      setCurrentFact(facts[randomIndex]);
    } else {
      // Get a random unpinned fact
      const randomIndex = Math.floor(Math.random() * unpinnedFacts.length);
      setCurrentFact(unpinnedFacts[randomIndex]);
    }

    // Trigger animation
    setIsNewFact(true);
    setTimeout(() => setIsNewFact(false), 500);
  }, [facts]);

  // Toggle collapsed state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Handle pin/unpin button click - increments agree count when pinning
  const handleTogglePin = (factId) => {
    setFacts(prevFacts => 
      prevFacts.map(fact => {
        if (fact.id === factId) {
          // If we're pinning the fact (not unpinning), also increment the agree count
          if (!fact.isPinned) {
            return { ...fact, isPinned: true, agrees: fact.agrees + 1 };
          } else {
            return { ...fact, isPinned: false };
          }
        }
        return fact;
      })
    );
  };

  // Listen for facts updated event from admin panel
  useEffect(() => {
    const handleFactsUpdated = (event) => {
      if (event.detail && event.detail.facts) {
        setFacts(event.detail.facts);
      }
    };

    window.addEventListener('factsUpdated', handleFactsUpdated);
    return () => window.removeEventListener('factsUpdated', handleFactsUpdated);
  }, []);

  // Get all pinned facts
  const pinnedFacts = facts.filter(fact => fact.isPinned);

  return (
    <div className="fact-engine-container">
      <div className="fact-engine-header" onClick={toggleCollapse}>
        <h3>TeaSpace Fact Engine</h3>
        <div className={`fact-engine-toggle ${isCollapsed ? 'collapsed' : ''}`}>
          ▼
        </div>
      </div>

      <div className={`fact-engine-body ${isCollapsed ? 'collapsed' : ''}`}>
        {currentFact && (
          <div className={`fact-card ${isNewFact ? 'new-fact' : ''}`}>
            <p className="fact-text">{currentFact.text}</p>
            <div className="fact-footer">
              <div className="agree-count">
                <span className="agree-count-icon">👍</span>
                <span>{currentFact.agrees} agrees</span>
              </div>
              <div className="fact-actions">
                {!currentFact.isPinned ? (
                  <button 
                    className="fact-btn pin-btn"
                    onClick={() => handleTogglePin(currentFact.id)}
                  >
                    Agree & Make it Stick
                  </button>
                ) : (
                  <button 
                    className="fact-btn unpin-btn"
                    onClick={() => handleTogglePin(currentFact.id)}
                  >
                    Unpin
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <button 
          className="generate-btn"
          onClick={generateRandomFact}
        >
          Generate Fact
        </button>

        {pinnedFacts.length > 0 && (
          <div className="pinned-facts-section">
            <div className="pinned-facts-header">
              Pinned Facts
            </div>

            {pinnedFacts.map(fact => (
              <div key={fact.id} className="fact-card pinned">
                <p className="fact-text">{fact.text}</p>
                <div className="fact-footer">
                  <div className="agree-count">
                    <span className="agree-count-icon">👍</span>
                    <span>{fact.agrees} agrees</span>
                  </div>
                  <div className="fact-actions">
                    <button 
                      className="fact-btn unpin-btn"
                      onClick={() => handleTogglePin(fact.id)}
                    >
                      Unpin
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FactEngine;
