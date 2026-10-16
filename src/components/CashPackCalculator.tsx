import React, { useState } from 'react';
import { Banknote, Copy, Check, Info } from 'lucide-react';
import { Currency } from '../data/currencies';
import { convertCurrency } from '../services/ratesService';

interface CashPackCalculatorProps {
  rates: Record<string, number>;
  targetCurrency: Currency;
  onOpenTargetModal: () => void;
}

export const CashPackCalculator: React.FC<CashPackCalculatorProps> = ({
  rates,
  targetCurrency,
  onOpenTargetModal,
}) => {
  const [budgetSGD, setBudgetSGD] = useState<number>(1500);
  const [strategy, setStrategy] = useState<'balanced' | 'small' | 'large'>('balanced');
  const [copied, setCopied] = useState<boolean>(false);

  const { result: convertedTotal, rate } = convertCurrency(budgetSGD, 'SGD', targetCurrency.code, rates);

  // Compute denomination allocation
  const denominations = targetCurrency.denominations || [100, 50, 20, 10];
  const sortedDenoms = [...denominations].sort((a, b) => b - a);

  // Allocation logic based on strategy
  let remaining = Math.floor(convertedTotal);
  const breakdown: { denom: number; count: number; total: number }[] = [];

  if (strategy === 'balanced') {
    // 50% large notes, 30% mid notes, 20% small notes
    const largeDenom = sortedDenoms[0];
    const midDenom = sortedDenoms[Math.min(1, sortedDenoms.length - 1)];
    const smallDenoms = sortedDenoms.slice(2);

    // Target amounts
    const targetLarge = remaining * 0.55;
    const countLarge = Math.floor(targetLarge / largeDenom);
    if (countLarge > 0) {
      breakdown.push({ denom: largeDenom, count: countLarge, total: countLarge * largeDenom });
      remaining -= countLarge * largeDenom;
    }

    const targetMid = remaining * 0.6;
    const countMid = Math.floor(targetMid / midDenom);
    if (countMid > 0) {
      breakdown.push({ denom: midDenom, count: countMid, total: countMid * midDenom });
      remaining -= countMid * midDenom;
    }

    // Allocate rest to remaining smaller denoms
    for (const d of smallDenoms) {
      if (remaining >= d) {
        const c = Math.floor(remaining / d);
        breakdown.push({ denom: d, count: c, total: c * d });
        remaining -= c * d;
      }
    }

    // Any remainder back to smallest denom
    const smallest = sortedDenoms[sortedDenoms.length - 1];
    if (remaining >= smallest) {
      const c = Math.floor(remaining / smallest);
      const existing = breakdown.find((b) => b.denom === smallest);
      if (existing) {
        existing.count += c;
        existing.total += c * smallest;
      } else {
        breakdown.push({ denom: smallest, count: c, total: c * smallest });
      }
      remaining -= c * smallest;
    }
  } else if (strategy === 'large') {
    for (const d of sortedDenoms) {
      if (remaining >= d) {
        const c = Math.floor(remaining / d);
        breakdown.push({ denom: d, count: c, total: c * d });
        remaining -= c * d;
      }
    }
  } else {
    // Small notes priority
    const reverseDenoms = [...sortedDenoms].reverse();
    for (const d of reverseDenoms) {
      // Allocate up to 10 notes of each small denomination
      const maxCount = 15;
      const count = Math.min(maxCount, Math.floor(remaining / d));
      if (count > 0) {
        breakdown.push({ denom: d, count, total: count * d });
        remaining -= count * d;
      }
    }
    // Remainder in larger
    for (const d of sortedDenoms) {
      if (remaining >= d) {
        const c = Math.floor(remaining / d);
        const existing = breakdown.find((b) => b.denom === d);
        if (existing) {
          existing.count += c;
          existing.total += c * d;
        } else {
          breakdown.push({ denom: d, count: c, total: c * d });
        }
        remaining -= c * d;
      }
    }
  }

  // Sort breakdown descending by denomination
  breakdown.sort((a, b) => b.denom - a.denom);
  const totalAllocated = breakdown.reduce((sum, item) => sum + item.total, 0);

  const handleCopySlip = () => {
    const lines = [
      `MAS Exchanger - Travel Cash Request Slip`,
      `Destination: ${targetCurrency.name} (${targetCurrency.code})`,
      `Budget: S$${budgetSGD} (~${Math.round(convertedTotal).toLocaleString()} ${targetCurrency.code})`,
      `Requested Banknote Breakdown:`,
      ...breakdown.map(
        (b) =>
          `- ${targetCurrency.symbol}${b.denom.toLocaleString()} × ${b.count} notes = ${targetCurrency.symbol}${b.total.toLocaleString()}`
      ),
      `Total Cash: ${targetCurrency.symbol}${totalAllocated.toLocaleString()}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Banknote className="w-6 h-6 text-emerald-400" />
              Travel Cash Denomination Pack
            </h2>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Optimized banknote breakdown for money changers and overseas travel</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-300">
                1 SGD = {rate.toFixed(4)} {targetCurrency.code}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-2 shrink-0">
            <div className="px-3">
              <label className="text-[10px] text-slate-400 block uppercase font-medium">Budget in SGD</label>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-slate-400">S$</span>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={budgetSGD}
                  onChange={(e) => setBudgetSGD(Math.max(10, parseFloat(e.target.value) || 0))}
                  className="w-24 bg-transparent text-lg font-bold font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={onOpenTargetModal}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-white transition-colors"
            >
              <span className="text-lg">{targetCurrency.flag}</span>
              <span className="font-semibold text-xs">{targetCurrency.code}</span>
              <span className="text-[10px] text-slate-400">Change</span>
            </button>
          </div>
        </div>

        {/* Strategy Selector */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Packing Strategy:</span>
            <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
              <button
                onClick={() => setStrategy('balanced')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  strategy === 'balanced'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Balanced Mix (Recommended)
              </button>
              <button
                onClick={() => setStrategy('small')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  strategy === 'small'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Small Notes (Street Food/Taxis)
              </button>
              <button
                onClick={() => setStrategy('large')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  strategy === 'large'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Large Notes (Slim Wallet)
              </button>
            </div>
          </div>

          <button
            onClick={handleCopySlip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors self-start sm:self-auto shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Slip Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Teller Slip</span>
              </>
            )}
          </button>
        </div>

        {/* Note Breakdown Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {breakdown.map((item) => (
            <div
              key={item.denom}
              className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Banknote</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {item.count} {item.count === 1 ? 'note' : 'notes'}
                </span>
              </div>

              <div className="my-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-white tabular-nums">
                  {targetCurrency.symbol}
                  {item.denom.toLocaleString()}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400 tabular-nums">
                <span>Subtotal:</span>
                <span className="text-slate-200">
                  {targetCurrency.symbol}
                  {item.total.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Total Allocated Cash:{' '}
              <strong className="text-white font-mono">
                {targetCurrency.symbol}
                {totalAllocated.toLocaleString()} {targetCurrency.code}
              </strong>{' '}
              (Equivalent to approx S${(totalAllocated / rate).toFixed(2)})
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Show this breakdown to the money changer teller for exact bills.
          </div>
        </div>
      </div>
    </div>
  );
};
