import React, { useState } from 'react';
import { GripVertical, X, Check, Plus, Trash2 } from 'lucide-react';

const TodoList = () => {
  const [items, setItems] = useState([
      { id: 'todo1', text: 'ESLint', completed: false, type: 'header' },
      { id: 'sub1', text: 'ESLint', completed: false, type: 'subheader' },
      {
          id: 'todo2',
          text: 'model1 synthesizer display optimization',
          completed: false,
          type: 'header',
      },
      { id: 'sub1', text: 'z index and alignment', completed: false, type: 'subheader' },
      {
          id: 'todo3',
          text: 'efficacy and sensitivity position adjustments',
          completed: false,
          type: 'header',
      },
      { id: 'task3', text: 'backend functionality restoration', completed: false, type: 'header' },
      { id: 'sub3', text: 'batches', completed: false, type: 'subheader' },
      { id: 'sub4', text: 'run cfa', completed: false, type: 'subheader' },
      { id: 'sub5', text: 'visualization validation', completed: false, type: 'subheader' },

      { id: 'todo4', text: 'sensitivity', completed: false, type: 'header' },
      { id: 'sub7', text: 'design optimization', completed: false, type: 'subheader' },
      { id: 'sub8', text: 'synchronization', completed: false, type: 'subheader' },
  ]);

  const [draggedId, setDraggedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [newItemType, setNewItemType] = useState('bullet');

  const handleDragStart = (id) => {
    setDraggedId(id);
  };

  const handleDrop = (targetId) => {
    if (draggedId !== null && draggedId !== targetId) {
      const newItems = [...items];
      const draggedIndex = items.findIndex(item => item.id === draggedId);
      const targetIndex = items.findIndex(item => item.id === targetId);
      const [removed] = newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, removed);
      setItems(newItems);
    }
    setDraggedId(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const saveEdit = () => {
    if (editingId) {
      setItems(items.map(item =>
        item.id === editingId ? { ...item, text: editText } : item
      ));
      setEditingId(null);
      setEditText('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const toggleComplete = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const addNewItem = () => {
    const newId = `item${items.length + 1}`;
    const newItem = {
      id: newId,
      text: 'New Item',
      completed: false,
      type: newItemType
    };
    setItems([...items, newItem]);
    startEdit(newItem);
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="mb-4 flex gap-2">
        <select
          className="p-2 border rounded"
          value={newItemType}
          onChange={(e) => setNewItemType(e.target.value)}
        >
          <option value="header">Header</option>
          <option value="subheader">Subheader</option>
          <option value="bullet">Task</option>
        </select>
        <button
          onClick={addNewItem}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors ${
              item.type === 'header' ? 'font-bold text-lg ml-0' :
              item.type === 'subheader' ? 'font-semibold ml-4' :
              'ml-8'
            } ${item.completed ? 'text-gray-400' : ''}`}
            draggable={editingId !== item.id}
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(item.id)}
          >
            <GripVertical className="text-gray-400 cursor-move flex-shrink-0" size={16} />

            {item.type === 'bullet' && (
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => toggleComplete(item.id)}
                className="h-4 w-4"
              />
            )}

            {editingId === item.id ? (
              <>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveEdit();
                    }
                  }}
                  className="flex-1 p-1 border rounded"
                  autoFocus
                />
                <button
                  onClick={saveEdit}
                  className="p-1 text-green-600 hover:text-green-800"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <span
                  className={`flex-1 cursor-pointer ${
                    item.completed ? 'line-through' : ''
                  }`}
                  onClick={() => startEdit(item)}
                >
                  {item.text}
                </span>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodoList;
