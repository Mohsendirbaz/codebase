import React, { useState, useEffect, useRef } from 'react';
import '../../styles/HomePage.CSS/HCSS.css';

// Local storage key - must match the one in FactEngine.js
const FACT_STORAGE_KEY = 'teaSpaceFacts';

const FactEngineAdmin = () => {
  const [facts, setFacts] = useState([]);
  const [editingFactId, setEditingFactId] = useState(null);
  const [editText, setEditText] = useState('');
  const [newFactText, setNewFactText] = useState('');
  const addFactInputRef = useRef(null);
  const editFactInputRef = useRef(null);

  // Load facts from localStorage
  useEffect(() => {
    const loadFacts = () => {
      try {
        const storedFactsJSON = localStorage.getItem(FACT_STORAGE_KEY);

        if (storedFactsJSON) {
          const storedFacts = JSON.parse(storedFactsJSON);
          setFacts(storedFacts);
        } else {
          // If no facts in localStorage yet, load default ones
          const defaultFacts = [
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
          setFacts(defaultFacts);
          localStorage.setItem(FACT_STORAGE_KEY, JSON.stringify(defaultFacts));
        }
      } catch (error) {
        console.error('Error loading facts in admin panel:', error);
      }
    };

    loadFacts();

    // Set up storage event listener to sync across components
    const handleStorageChange = (e) => {
      if (e.key === FACT_STORAGE_KEY && e.newValue !== null) {
        setFacts(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update localStorage when facts change
  useEffect(() => {
    if (facts.length > 0) {
      localStorage.setItem(FACT_STORAGE_KEY, JSON.stringify(facts));

      // Dispatch a custom event to notify other components
      window.dispatchEvent(new CustomEvent('factsUpdated', { 
        detail: { facts }
      }));
    }
  }, [facts]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingFactId !== null && editFactInputRef.current) {
      editFactInputRef.current.focus();
    }
  }, [editingFactId]);

  // Calculate total agrees across all facts
  const totalAgrees = facts.reduce((sum, fact) => sum + fact.agrees, 0);

  // Add a new fact
  const handleAddFact = () => {
    if (newFactText.trim() === '') return;

    // Find the highest ID and increment by 1
    const newId = facts.length > 0 
      ? Math.max(...facts.map(fact => fact.id)) + 1 
      : 1;

    const newFact = {
      id: newId,
      text: newFactText,
      agrees: 0,
      isPinned: false
    };

    setFacts([...facts, newFact]);
    setNewFactText('');
    addFactInputRef.current.focus();
  };

  // Reset all votes
  const handleResetAllVotes = () => {
    if (window.confirm('Are you sure you want to reset all vote counts to zero?')) {
      const resetFacts = facts.map(fact => ({
        ...fact,
        agrees: 0
      }));
      setFacts(resetFacts);
    }
  };

  // Reset votes for a specific fact
  const handleResetFactVotes = (factId) => {
    setFacts(prevFacts => 
      prevFacts.map(fact => 
        fact.id === factId 
          ? { ...fact, agrees: 0 } 
          : fact
      )
    );
  };

  // Start editing a fact
  const handleEditFact = (fact) => {
    setEditingFactId(fact.id);
    setEditText(fact.text);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingFactId(null);
    setEditText('');
  };

  // Save edited fact
  const handleSaveEdit = (factId) => {
    if (editText.trim() === '') return;

    setFacts(prevFacts => 
      prevFacts.map(fact => 
        fact.id === factId 
          ? { ...fact, text: editText } 
          : fact
      )
    );

    setEditingFactId(null);
    setEditText('');
  };

  // Delete a fact
  const handleDeleteFact = (factId) => {
    if (window.confirm('Are you sure you want to delete this fact?')) {
      setFacts(prevFacts => prevFacts.filter(fact => fact.id !== factId));
    }
  };

  return (
    <div className="fact-admin-container">
      <div className="fact-admin-header">
        <h2 className="fact-admin-title">TeaSpace Fact Engine Admin</h2>
        <button 
          className="reset-all-btn"
          onClick={handleResetAllVotes}
        >
          Reset All Votes
        </button>
      </div>

      <div className="facts-summary">
        <div className="summary-card">
          <div className="summary-number">{facts.length}</div>
          <div className="summary-label">Total Facts</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">{totalAgrees}</div>
          <div className="summary-label">Total Agrees</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">{facts.filter(f => f.isPinned).length}</div>
          <div className="summary-label">Pinned Facts</div>
        </div>
      </div>

      <div className="add-fact-section">
        <h3>Add New Fact</h3>
        <div className="add-fact-form">
          <textarea
            ref={addFactInputRef}
            value={newFactText}
            onChange={(e) => setNewFactText(e.target.value)}
            placeholder="Enter a new educational fact..."
          />
          <button 
            className="add-fact-btn"
            onClick={handleAddFact}
            disabled={!newFactText.trim()}
          >
            <span className="add-fact-icon">➕ Add Fact</span>

          </button>
        </div>
      </div>

      <div className="facts-list-section">
        <h3>Manage Facts</h3>
        {facts.length === 0 ? (
          <div className="no-facts-message">No facts available</div>
        ) : (
          <ul className="fact-admin-list">
            {facts.map(fact => (
              <li key={fact.id} className="fact-admin-item">
                {editingFactId === fact.id ? (
                  <div className="fact-edit-form">
                    <textarea
                      ref={editFactInputRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div className="fact-edit-actions">
                      <button 
                        className="fact-admin-btn fact-save-btn"
                        onClick={() => handleSaveEdit(fact.id)}
                        disabled={!editText.trim()}
                      >
                        Save
                      </button>
                      <button 
                        className="fact-admin-btn fact-cancel-btn"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="fact-admin-content">
                      <p className="fact-admin-text">{fact.text}</p>
                      <div className="fact-admin-stats">
                        <div className="fact-admin-agrees">
                          <span className="fact-admin-agrees-icon">👍</span>
                          <span>{fact.agrees} agrees</span>
                        </div>
                        {fact.isPinned && (
                          <div className="fact-admin-pinned">
                            <span className="fact-admin-pinned-icon">📌</span>
                            <span>Pinned</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="fact-admin-actions">
                      <button 
                        className="fact-admin-btn fact-admin-edit-btn"
                        onClick={() => handleEditFact(fact)}
                      >
                        Edit
                      </button>
                      <button 
                        className="fact-admin-btn fact-admin-reset-btn"
                        onClick={() => handleResetFactVotes(fact.id)}
                      >
                        Reset Votes
                      </button>
                      <button 
                        className="fact-admin-btn fact-admin-delete-btn"
                        onClick={() => handleDeleteFact(fact.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FactEngineAdmin;
