import { useState } from 'react';
import { StartAttemptData } from '../../types/attempt';

interface ParticipantFormProps {
  onSubmit: (data: StartAttemptData) => void;
  customFields?: Record<string, any>[];
}

export const ParticipantForm: React.FC<ParticipantFormProps> = ({ onSubmit, customFields = [] }) => {
  const [name, setName] = useState('');
  const [customData, setCustomData] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      participant_name: name,
      participant_info: Object.keys(customData).length > 0 ? customData : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Name *
        </label>
        <input
          type="text"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {customFields.map((field, index) => (
        <div key={index}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label || `Field ${index + 1}`}
            {field.required && ' *'}
          </label>
          <input
            type={field.type || 'text'}
            required={field.required}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={customData[field.name || `field${index}`] || ''}
            onChange={(e) =>
              setCustomData({
                ...customData,
                [field.name || `field${index}`]: e.target.value,
              })
            }
          />
        </div>
      ))}

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
      >
        Start Quiz
      </button>
    </form>
  );
};

