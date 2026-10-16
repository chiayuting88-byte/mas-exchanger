import React, { useState } from 'react';
import { ArrowUpDown, Copy, Check, TrendingUp, Wallet, Store, Info } from 'lucide-react';
import { Currency, CURRENCIES } from '../data/currencies';
import { convertCurrency } from '../services/ratesService';

interface QuickConverterProps {
  rates: Record<string, number>;
  fromCurrency: Currency;
  toCurrency: Currency;
  setFromCurrency: (c: Currency) => void;
  setToCurrency: (c: Currency) => void;
  onOpenFromModal: () => void;
  onOpenToModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const QuickConverter: React.FC<QuickConverterProps> = ({
  rates,
  fromCurrency,
  toCurrency,
  setFromCurrency,
  setToCurrency,
  onOpenFromModal,
  onOpenToModal,
  onNavigateTab,
}) => {
  const [amountStr, setAmountStr] = useState<string>('1000');
  const [copied, setCopied] = useState<boolean>(false);
  const [feeMode, setFeeMode] = useState<'mid' | 'money_changer' | 'card' | 'bank'>('mid');

  const amount = parseFloat(amountStr) || 0;

  // Base mid-market conversion
  const { result: midResult, rate: rawRate, inverseRate: rawInverseRate } = convertCurrency(
    amount,
    fromCurrency.code,
    toCurrency.code,
    rates
  );

  // Apply simulated spread
  let spreadPercent = 0;
  let fixedFeeInBase = 0;
  if (feeMode === 'money_changer') {
    spreadPercent = 0.3; // Wholesale SG Money Changer average
  } else if (feeMode === 'card') {
    spreadPercent = 3.25; // Standard bank visa/mastercard FX fee
  } else if (feeMode === 'bank') {
    spreadPercent = 1.25; // Bank wire spread
    fixedFeeInBase = fromCurrency.code === 'SGD' ? 10 : 10 / (rates[fromCurrency.code] || 1);
  }

  const effectiveNetBase = Math.max(0, amount - fixedFeeInBase);
  const effectiveRate = rawRate * (1 - spreadPercent / 100);
  const finalResult = effectiveNetBase * effectiveRate;

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleCopy = () => {
    const text = `${amount.toLocaleString()} ${fromCurrency.code} = ${finalResult.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })} ${toCurrency.code}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const presets = [100, 500, 1000, 2500, 5000, 10000];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Primary Card Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-950/50 backdrop-blur-sm">
        {/* Title and Mode bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800/80">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Currency Converter
            </h2>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>MAS Wholesale & Retail FX Engine</span>
              <span aria-hidden="true">·</span>
              <span>Updated Real-Time</span>
            </div>
          </div>

          {/* Fee Mode Segmented Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setFeeMode('mid')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                feeMode === 'mid'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mid-Market (0%)
            </button>
            <button
              onClick={() => setFeeMode('money_changer')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                feeMode === 'money_changer'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Money Changer (0.3%)
            </button>
            <button
              onClick={() => setFeeMode('card')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                feeMode === 'card'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Credit Card (3.25%)
            </button>
          </div>
        </div>

        {/* Currency Pair Input Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] items-center gap-4">
          {/* Source Currency */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium">You Pay / Send</span>
              <span className="font-mono tabular-nums text-slate-400">
                Balance Base: {fromCurrency.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                min="0"
                step="any"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white placeholder-slate-600 focus:outline-none"
              />

              <button
                type="button"
                onClick={onOpenFromModal}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-white transition-all shrink-0 shadow-sm"
              >
                <span className="text-xl leading-none">{fromCurrency.flag}</span>
                <span className="font-bold text-sm">{fromCurrency.code}</span>
                <span className="text-xs text-slate-400">▼</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 mt-2 truncate">
              {fromCurrency.name}
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 lg:my-0 z-10">
            <button
              onClick={handleSwap}
              title="Invert currencies"
              className="p-3 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-300 transition-all shadow-md group active:scale-95"
            >
              <ArrowUpDown className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
            </button>
          </div>

          {/* Target Currency */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium">You Receive (Estimated)</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Copy conversion"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="w-full text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-400 truncate">
                {finalResult.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: toCurrency.code === 'JPY' || toCurrency.code === 'KRW' || toCurrency.code === 'IDR' || toCurrency.code === 'VND' ? 0 : 2,
                })}
              </div>

              <button
                type="button"
                onClick={onOpenToModal}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-white transition-all shrink-0 shadow-sm"
              >
                <span className="text-xl leading-none">{toCurrency.flag}</span>
                <span className="font-bold text-sm">{toCurrency.code}</span>
                <span className="text-xs text-slate-400">▼</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 mt-2 truncate">
              {toCurrency.name}
            </div>
          </div>
        </div>

        {/* Quick Amount Presets */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs text-slate-400 shrink-0">Quick Amount ({fromCurrency.code}):</span>
          {presets.map((val) => (
            <button
              key={val}
              onClick={() => setAmountStr(val.toString())}
              className={`px-3 py-1 text-xs font-mono font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                amountStr === val.toString()
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {val >= 1000 ? `${val / 1000}k` : val}
            </button>
          ))}
        </div>

        {/* Clean Unboxed Metadata Strip */}
        <div className="mt-6 pt-5 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums">
            <span>
              1 {fromCurrency.code} = {rawRate.toFixed(4)} {toCurrency.code}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              1 {toCurrency.code} = {rawInverseRate.toFixed(4)} {fromCurrency.code}
            </span>
            {fromCurrency.code === 'SGD' && toCurrency.unitScale && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">
                  MAS standard: 100 {toCurrency.code} = {(rawInverseRate * 100).toFixed(3)} SGD
                </span>
              </>
            )}
          </div>

          {feeMode !== 'mid' && (
            <div className="text-amber-400/90 flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                Simulated markup spread: -{spreadPercent}% ({((midResult - finalResult)).toFixed(2)} {toCurrency.code} impact)
              </span>
            </div>
          )}
        </div>

        {/* Action Discovery Tiles */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigateTab('providers')}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                Money Changers
              </div>
              <div className="text-[11px] text-slate-400">
                Compare The Arcade vs Banks
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('cashpack')}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors">
                Travel Cash Pack
              </div>
              <div className="text-[11px] text-slate-400">
                Calculate note denominations
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('trends')}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors">
                Charts & Ranges
              </div>
              <div className="text-[11px] text-slate-400">
                View 7D to 1Y historical curves
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
