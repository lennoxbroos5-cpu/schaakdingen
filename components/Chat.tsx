import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  playerId: string;
}

export const Chat: React.FC<ChatProps> = ({ messages, onSend, playerId }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
      <div className="p-3 bg-slate-800 border-b border-slate-700 font-semibold text-sm text-slate-300">
        Live Chat
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-slate-600 text-xs italic mt-4">
            Nog geen berichten...
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender === playerId;
            return (
              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    isMe 
                      ? 'bg-brand-accent text-white rounded-tr-none' 
                      : 'bg-slate-700 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="text-[10px] opacity-50 block text-right mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Typ een bericht..."
          className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-accent"
        />
        <button 
          type="submit"
          className="p-2 bg-brand-accent hover:bg-brand-accentHover text-white rounded transition-colors"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
