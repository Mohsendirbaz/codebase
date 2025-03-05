import React, { useState } from 'react';
import { GripVertical, X, Check } from 'lucide-react';

const EditableHierarchicalList = () => {
  const [items, setItems] = useState([
    { id: 'h1', text: 'Part I: The Windows Legacy and Remorseful Buyer. Story of how China caught up with west', type: 'header' },
    { id: 'h1c1', text: '1. Foundation', type: 'subheader' },
    { id: 'b1', text: 'Evolution of operating system architecture', type: 'bullet' },
    { id: 'b2', text: 'System logging and tracking mechanisms', type: 'bullet' },
    { id: 'b3', text: 'The challenge of backward compatibility', type: 'bullet' },
    { id: 'b4', text: 'Analysis of registry systems, traceability and file hierarchies', type: 'bullet' },
    { id: 'h1c2', text: '2. The Complexity Crisis', type: 'subheader' },
    { id: 'b5', text: 'Application management challenges', type: 'bullet' },
    { id: 'b6', text: 'System monitoring limitations', type: 'bullet' },
    { id: 'b7', text: 'Impact on maintenance and reliability', type: 'bullet' },
    { id: 'b8', text: 'Hidden costs of fragmented architecture', type: 'bullet' },

    { id: 'h2', text: 'Part II: The Infrastructure-Innovation Divide', type: 'header' },
    { id: 'h2c1', text: '3. Scalability Limitations', type: 'subheader' },
    { id: 'b9', text: 'How application capabilities have outpaced system design', type: 'bullet' },
    { id: 'b10', text: 'Barriers to system growth and adaptation', type: 'bullet' },
    { id: 'b11', text: 'Case studies in system bottlenecks', type: 'bullet' },
    { id: 'b12', text: 'Impact on national technological competitiveness', type: 'bullet' },
    { id: 'h2c2', text: '4. The Marketing-Reality Gap', type: 'subheader' },
    { id: 'b13', text: 'Analysis of research and development patterns', type: 'bullet' },
    { id: 'b14', text: 'The role of marketing in technology perception', type: 'bullet' },
    { id: 'b15', text: 'Case study: Self-driving technology investments', type: 'bullet' },
    { id: 'b16', text: 'Comparing investment levels across industries', type: 'bullet' },

    { id: 'h3', text: 'Part III: Environmental and Computational Sustainability', type: 'header' },
    { id: 'h3c1', text: '5. Torch and 1,000,000 degree C', type: 'subheader' },
    { id: 'b17', text: 'Environmental impact of current computing practices', type: 'bullet' },
    { id: 'b18', text: 'Energy consumption patterns in software systems', type: 'bullet' },
    { id: 'b19', text: 'The carbon footprint of technological infrastructure', type: 'bullet' },
    { id: 'b20', text: 'Analysis of computational efficiency', type: 'bullet' },
    { id: 'h3c2', text: '6. Sustainable Computing Architecture', type: 'subheader' },
    { id: 'b21', text: 'Alternative approaches to system design', type: 'bullet' },
    { id: 'b22', text: 'Scalable architectural patterns', type: 'bullet' },
    { id: 'b23', text: 'Performance optimization strategies', type: 'bullet' },
    { id: 'b24', text: 'Resource-efficient development practices', type: 'bullet' },

    { id: 'h4', text: 'Part IV: Reimagining Digital Infrastructure', type: 'header' },
    { id: 'h4c1', text: '7. Scalable System Design', type: 'subheader' },
    { id: 'b25', text: 'Principles for sustainable growth', type: 'bullet' },
    { id: 'b26', text: 'Managing complexity in large systems', type: 'bullet' },
    { id: 'b27', text: 'Approaches to system optimization', type: 'bullet' },
    { id: 'b28', text: 'Building adaptable infrastructures', type: 'bullet' },
    { id: 'h4c2', text: '8. The Future of Computing Infrastructure', type: 'subheader' },
    { id: 'b29', text: 'Emerging architectural patterns', type: 'bullet' },
    { id: 'b30', text: 'Sustainable development frameworks', type: 'bullet' },
    { id: 'b31', text: 'Balancing innovation with stability', type: 'bullet' },
    { id: 'b32', text: 'Recommendations for system evolution', type: 'bullet' }
  ]);

  const [draggedId, setDraggedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors ${
              item.type === 'header' ? 'font-bold text-lg ml-0' :
              item.type === 'subheader' ? 'font-semibold ml-4' :
              'ml-8'
            }`}
            draggable={editingId !== item.id}
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(item.id)}
          >
            <GripVertical className="text-gray-400 cursor-move flex-shrink-0" size={16} />

            {editingId === item.id ? (
              <>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
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
                  className="text-gray-700 flex-1 cursor-pointer"
                  onClick={() => startEdit(item)}
                >
                  {item.text}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditableHierarchicalList;
