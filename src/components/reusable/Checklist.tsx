'use client';

import { useState } from 'react';

interface ChecklistItem {
  id: string;
  text: string;
  description?: string;
  required?: boolean;
  completed?: boolean;
}

interface ChecklistProps {
  items: ChecklistItem[];
  onItemToggle?: (itemId: string, completed: boolean) => void;
  title?: string;
  className?: string;
}

export default function Checklist({
  items,
  onItemToggle,
  title,
  className = ""
}: ChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    new Set(items.filter(item => item.completed).map(item => item.id))
  );

  const handleToggle = (itemId: string) => {
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(itemId)) {
      newCheckedItems.delete(itemId);
    } else {
      newCheckedItems.add(itemId);
    }
    setCheckedItems(newCheckedItems);
    onItemToggle?.(itemId, newCheckedItems.has(itemId));
  };

  const completedCount = checkedItems.size;
  const totalCount = items.length;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progress: {completedCount} of {totalCount} completed
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((completedCount / totalCount) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {items.map((item) => {
          const isChecked = checkedItems.has(item.id);
          return (
            <div
              key={item.id}
              className={`flex items-start p-3 rounded-lg border transition-colors ${
                isChecked
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <button
                onClick={() => handleToggle(item.id)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mr-3 mt-0.5 transition-colors ${
                  isChecked
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                aria-label={`${isChecked ? 'Uncheck' : 'Check'} ${item.text}`}
              >
                {isChecked && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${
                    isChecked ? 'text-green-700 line-through' : 'text-gray-900'
                  }`}>
                    {item.text}
                  </span>
                  {item.required && (
                    <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                      Required
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className={`text-xs mt-1 ${
                    isChecked ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {completedCount === totalCount && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-700 font-medium">All items completed!</span>
          </div>
        </div>
      )}
    </div>
  );
} 