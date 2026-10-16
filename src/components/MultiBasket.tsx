import React, { useState } from 'react';
import { Plus, Trash2, ArrowRightLeft, Copy, Check } from 'lucide-react';
import { Currency, CURRENCIES } from '../data/currencies';
import { convertCurrency } from '../services/ratesService';

interface MultiBasketProps {
  rates: Record<string, number>;
  baseCurrency: Currency;
  setBaseCurrency: (c: Currency) => void;
  onOpenBaseModal: () => void;
}

export const MultiBasket: React.FC<MultiBasketProps> = ({
  rates,
  baseCurrency,
  setBaseCurrency,
  onOpenBaseModal,
}) => {
  const [baseAmount, setBaseAmount] = useState<number>(1000);
  const [basketCodes, setBasketCodes] = useState<string[]>([
    'MYR',
    'JPY',
    'USD',
    'EUR',
    'THB',
    'AUD',
    'KRW',
    'CNY',
    'IDR',
  ]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const availableCurrencies = CURRENCIES.filter(
    (c) => c.code !== baseCurrency.code && !basketCodes.includes(c.code)
  );

  const handleAddCurrency = (code: string) => {
    if (!basketCodes.includes(code)) {
      setBasketCodes([...basketCodes, code]);
    }
  };

  const handleRemoveCurrency = (code: string) => {
    setBasketCodes(basketCodes.filter((c) => c !== code));
  };

  const handleCopyOne = (targetCode: string, resultAmount: number) => {
    const text = `${baseAmount.toLocaleString()} ${baseCurrency.code} = ${resultAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${targetCode}`;
    navigator.clipboard.writeText(text);
    setCopiedCode(targetCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Controller */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Multi-Currency Basket
            </h2>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Simultaneous conversion into {basketCodes.length} world currencies</span>
              <span aria-hidden="true">·</span>
              <span>Regional Travel & Treasury Overview</span>
            </div>
          </div>

          {/* Base amount & base currency trigger */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-2 shrink-0">
            <div className="px-3">
              <label className="text-[10px] text-slate-400 block uppercase font-medium">Base Amount</label>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-slate-400">{baseCurrency.symbol}</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-28 bg-transparent text-lg font-bold font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={onOpenBaseModal}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-white transition-colors"
            >
              <span className="text-lg">{baseCurrency.flag}</span>
              <span className="font-semibold text-xs">{baseCurrency.code}</span>
              <span className="text-[10px] text-slate-400">Change</span>
            </button>
          </div>
        </div>

        {/* Currency Basket Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {basketCodes.map((code) => {
            const targetCurr = CURRENCIES.find((c) => c.code === code);
            if (!targetCurr) return null;

            const { result, rate } = convertCurrency(
              baseAmount,
              baseCurrency.code,
              targetCurr.code,
              rates
            );

            const isCopied = copiedCode === code;

            return (
              <div
                key={code}
                className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none">{targetCurr.flag}</span>
                    <div>
                      <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                        <span>{targetCurr.code}</span>
                        <span className="text-xs text-slate-400 font-normal">
                          ({targetCurr.symbol})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                        {targetCurr.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopyOne(code, result)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Copy amount"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRemoveCurrency(code)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Remove from basket"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/70">
                  <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums truncate">
                    {result.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits:
                        targetCurr.code === 'JPY' || targetCurr.code === 'KRW' || targetCurr.code === 'IDR'
                          ? 0
                          : 2,
                    })}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center justify-between">
                    <span>
                      1 {baseCurrency.code} = {rate.toFixed(4)} {targetCurr.code}
                    </span>
                    <button
                      onClick={() => {
                        setBaseCurrency(targetCurr);
                      }}
                      className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                      title="Make Base Currency"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Set Base</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add more currencies picker */}
        {availableCurrencies.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="text-xs text-slate-400 mb-2 font-medium">Add to basket:</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {availableCurrencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => handleAddCurrency(curr.code)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span>{curr.flag}</span>
                  <span className="font-medium">{curr.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
