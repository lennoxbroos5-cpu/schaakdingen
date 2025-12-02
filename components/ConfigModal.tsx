import React, { useState } from 'react';
import { FirebaseConfig } from '../types';
import { Settings, Check, AlertCircle } from 'lucide-react';

interface ConfigModalProps {
  onSave: (config: FirebaseConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ onSave }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      const config = JSON.parse(jsonInput);
      if (!config.apiKey || !config.databaseURL) {
        throw new Error("Configuratie mist essentiële velden (apiKey, databaseURL).");
      }
      onSave(config as FirebaseConfig);
      localStorage.setItem('chess_firebase_config', jsonInput);
    } catch (e) {
      setError("Ongeldige JSON of configuratie. Controleer je invoer.");
    }
  };

  // Load from local storage on mount if available
  React.useEffect(() => {
    const saved = localStorage.getItem('chess_firebase_config');
    if (saved) setJsonInput(saved);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-brand-card border border-slate-700 p-6 rounded-xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center gap-3 mb-4 text-brand-accent">
          <Settings size={28} />
          <h2 className="text-xl font-bold text-white">Firebase Configuratie</h2>
        </div>
        
        <p className="text-brand-muted text-sm mb-4">
          Om met vrienden te spelen, moet je dit verbinden met je Firebase Database.
          Plak hieronder je Firebase config object (JSON).
        </p>

        <textarea
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-brand-text h-40 focus:ring-2 focus:ring-brand-accent outline-none"
          placeholder='{ "apiKey": "...", "databaseURL": "..." }'
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />

        {error && (
          <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSave}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accentHover text-white py-3 rounded-lg font-semibold transition-all"
        >
          <Check size={20} />
          Verbinden & Opslaan
        </button>
      </div>
    </div>
  );
};
