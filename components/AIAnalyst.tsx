import React, { useState } from 'react';
import { Bot, X, Sparkles, RefreshCcw } from 'lucide-react';
import { Stock, PortfolioItem } from '../types.ts';
import { generateMarketAnalysis } from '../services/geminiService.ts';

interface AIAnalystProps {
  stocks: Stock[];
  holdings: PortfolioItem[];
  totalEquity: number;
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ stocks, holdings, totalEquity }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{ summary: string; recommendation: string } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateMarketAnalysis(stocks, holdings, totalEquity);
    setAnalysis(result);
    setLoading(false);
  };

  const toggleOpen = () => {
    if (!isOpen && !analysis) {
        // Auto generate on first open if empty
        handleGenerate();
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-white border-2 border-white/20"
        title="AI Market Analyst"
      >
        <Bot size={28} />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex justify-between items-start">
              <div className="text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles size={20} className="text-yellow-300" />
                  Gemini Market Analyst
                </h3>
                <p className="text-blue-100 text-sm mt-1 opacity-90">
                  Real-time portfolio insights powered by Google AI
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500 animate-pulse">Analyzing market trends...</p>
                </div>
              ) : analysis ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Market Summary</h4>
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm">
                      {analysis.summary}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                       <Bot size={14} /> Recommendation
                    </h4>
                    <p className="text-blue-900 dark:text-blue-100 font-medium text-sm">
                      "{analysis.recommendation}"
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleGenerate}
                    className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <RefreshCcw size={16} /> Update Analysis
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Unable to connect to analysis service.</p>
                  <button onClick={handleGenerate} className="text-blue-600 font-medium">Retry</button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 text-center border-t border-gray-100 dark:border-gray-700">
              <p className="text-[10px] text-gray-400">
                AI analysis is simulated for demonstration. Not financial advice.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};