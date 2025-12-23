import React, { useState, useEffect } from 'react';
import { Stock } from '../types';
import { getMarketAnalysis } from '../services/geminiService';

interface MarketAnalystProps {
  selectedStock: Stock;
}

export const MarketAnalyst: React.FC<MarketAnalystProps> = ({ selectedStock }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<string>('');

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await getMarketAnalysis(selectedStock);
    setAnalysis(result);
    setLastAnalyzed(selectedStock.symbol);
    setLoading(false);
  };

  // Reset analysis when stock changes, but don't auto-fetch to save tokens/avoid spam
  useEffect(() => {
    if (selectedStock.symbol !== lastAnalyzed) {
      setAnalysis('');
    }
  }, [selectedStock, lastAnalyzed]);

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full transform translate-x-10 -translate-y-10 blur-3xl"></div>
      
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </span>
            <h3 className="font-bold text-lg">Gemini Market Analyst</h3>
          </div>
          <button 
            onClick={handleAnalyze}
            disabled={loading}
            className={`
              px-4 py-2 bg-white text-indigo-700 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all
              ${loading ? 'opacity-70 cursor-wait' : 'hover:scale-105 active:scale-95'}
            `}
          >
            {loading ? 'Analyzing...' : `Analyze ${selectedStock.symbol}`}
          </button>
        </div>

        <div className="min-h-[80px] text-indigo-100 text-sm leading-relaxed">
          {analysis ? (
             <div className="animate-fade-in">
               {analysis.split('\n').map((line, i) => (
                 <p key={i} className="mb-2 last:mb-0">{line}</p>
               ))}
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-60">
              <p>Ask our AI analyst for insights on {selectedStock.name}...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};