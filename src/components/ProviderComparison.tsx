import React, { useState } from 'react';
import { Award, Building2, Smartphone, ShieldCheck, MapPin, Clock } from 'lucide-react';
import { Currency } from '../data/currencies';
import { calculateProviderComparison, convertCurrency } from '../services/ratesService';

interface ProviderComparisonProps {
  rates: Record<string, number>;
  targetCurrency: Currency;
  onOpenTargetModal: () => void;
}

export const ProviderComparison: React.FC<ProviderComparisonProps> = ({
  rates,
  targetCurrency,
  onOpenTargetModal,
}) => {
  const [sendAmountSGD, setSendAmountSGD] = useState<number>(1000);

  const { rate: midMarketRate } = convertCurrency(1, 'SGD', targetCurrency.code, rates);
  const comparisonResults = calculateProviderComparison(sendAmountSGD, targetCurrency.code, midMarketRate);

  const bestResult = comparisonResults.find((r) => r.isBest);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header card with amount controller */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Singapore Money Changer & Provider Comparison
            </h2>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
              <span>Comparing physical OTC cash kiosks vs digital multi-currency cards vs banks</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-emerald-400">
                Mid-market: 1 SGD = {midMarketRate.toFixed(4)} {targetCurrency.code}
              </span>
            </div>
          </div>

          {/* Amount input & currency trigger */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-2 shrink-0">
            <div className="px-3">
              <label className="text-[10px] text-slate-400 block uppercase font-medium">Exchanging</label>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-slate-400">S$</span>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={sendAmountSGD}
                  onChange={(e) => setSendAmountSGD(Math.max(1, parseFloat(e.target.value) || 0))}
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

        {/* Highlight Banner if Best Provider saves money */}
        {bestResult && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-300">
                  Best Value Channel: {bestResult.provider.name}
                </div>
                <div className="text-xs text-slate-400">
                  You receive{' '}
                  <span className="font-mono font-bold text-white tabular-nums">
                    {bestResult.receivedAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {targetCurrency.code}
                  </span>{' '}
                  with zero hidden transfer fees.
                </div>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
              <div className="text-[11px] text-slate-400">Saves vs Retail Bank Counter</div>
              <div className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                +S${bestResult.savingsVsBankSGD.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Providers Comparison Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs text-slate-400 font-medium">
                <th className="pb-3 pl-2">Channel / Provider</th>
                <th className="pb-3 px-3">Type</th>
                <th className="pb-3 px-3">Spread & Fee</th>
                <th className="pb-3 px-3">Effective Rate</th>
                <th className="pb-3 px-3 text-right">You Receive</th>
                <th className="pb-3 pr-2 text-right">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {comparisonResults.map((item) => {
                const p = item.provider;
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      item.isBest ? 'bg-emerald-500/5' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Provider Name */}
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            p.category === 'money_changer'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : p.category === 'fintech'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {p.category === 'money_changer' ? (
                            <MapPin className="w-4 h-4" />
                          ) : p.category === 'fintech' ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {item.isBest && (
                              <span className="text-[10px] text-emerald-400 font-normal">
                                (Best Value)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">{p.locationOrType}</div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-4 px-3 text-xs text-slate-400">
                      {p.category === 'money_changer'
                        ? 'Cash Over Counter'
                        : p.category === 'fintech'
                        ? 'Digital Account / Card'
                        : 'Bank Branch / Wire'}
                    </td>

                    {/* Spread */}
                    <td className="py-4 px-3">
                      <div className="text-xs text-slate-300 font-mono tabular-nums">
                        ~{p.spreadPercent}% spread
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        {p.fixedFeeSGD === 0 ? 'S$0 fee' : `+S$${p.fixedFeeSGD} fee`}
                      </div>
                    </td>

                    {/* Effective Rate */}
                    <td className="py-4 px-3 font-mono text-xs tabular-nums text-slate-300">
                      {item.effectiveRate.toFixed(4)}
                    </td>

                    {/* Received Amount */}
                    <td className="py-4 px-3 text-right">
                      <div className="font-bold font-mono text-sm sm:text-base text-white tabular-nums">
                        {item.receivedAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        <span className="text-xs text-slate-400">{targetCurrency.code}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        Cost: S${item.totalCostInSGD.toFixed(2)}
                      </div>
                    </td>

                    {/* Savings vs Bank */}
                    <td className="py-4 pr-2 text-right">
                      <span
                        className={`text-xs font-mono font-semibold tabular-nums ${
                          item.savingsVsBankSGD > 0 ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {item.savingsVsBankSGD > 0
                          ? `+S$${item.savingsVsBankSGD.toFixed(2)}`
                          : 'Benchmark'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Singapore Money Changer Insider Guides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-white font-semibold text-sm mb-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>The Arcade (Raffles Place)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The undisputed king of physical cash exchange in Singapore with 15+ competing stalls on Levels 1 & 2. Best rates for USD, EUR, GBP, AUD, and JPY.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Mon–Fri: 9:30 AM – 6:30 PM (Closed Sun)</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-white font-semibold text-sm mb-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>People&apos;s Park Complex (Chinatown)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Renowned for competitive rates on regional Asian currencies: Malaysian Ringgit (MYR), Chinese Yuan (CNY), and Thai Baht (THB). Cash-only transactions.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Daily: 10:00 AM – 8:30 PM</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-white font-semibold text-sm mb-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Mustafa Centre (Little India)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Open late / 24-hours with reliable inventory for exotic and South Asian currencies (INR, LKR, BDT, NPR, AED). Ideal for late-night emergency cash before flights.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>24 Hours / 7 Days a week</span>
          </div>
        </div>
      </div>
    </div>
  );
};
