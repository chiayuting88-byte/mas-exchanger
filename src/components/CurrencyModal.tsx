import React, { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import { Currency, CURRENCIES } from '../data/currencies';

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (currency: Currency) => void;
  selectedCode: string;
  title: string;
}

export const CurrencyModal: React.FC<CurrencyModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedCode,
  title,
}) => {
  const [search, setSearch] = useState('');

  const filteredCurrencies = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-slate-800/60 bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by currency code, name, or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 transition-colors"
            />
          </div>
        </div>

        {/* Quick popular row */}
        {!search && (
          <div className="px-4 py-2 border-b border-slate-800/40 bg-slate-950/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-xs text-slate-400 shrink-0 mr-1">Popular:</span>
            {['SGD', 'MYR', 'JPY', 'USD', 'EUR', 'THB', 'CNY', 'AUD'].map((code) => {
              const curr = CURRENCIES.find((c) => c.code === code);
              if (!curr) return null;
              return (
                <button
                  key={code}
                  onClick={() => {
                    onSelect(curr);
                    onClose();
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    selectedCode === code
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>{curr.flag}</span>
                  <span>{curr.code}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Currency List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2">
          {filteredCurrencies.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No currencies found matching &ldquo;{search}&rdquo;
            </div>
          ) : (
            filteredCurrencies.map((curr) => {
              const isSelected = curr.code === selectedCode;
              return (
                <button
                  key={curr.code}
                  onClick={() => {
                    onSelect(curr);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 text-white'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none">{curr.flag}</span>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{curr.code}</span>
                        <span className="text-xs text-slate-400">({curr.symbol})</span>
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[200px]">
                        {curr.name} · {curr.country}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
