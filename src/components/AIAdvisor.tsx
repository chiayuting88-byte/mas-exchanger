import React, { useState } from 'react';
import { Sparkles, Send, Compass, Lightbulb, Clock, CheckCircle2 } from 'lucide-react';
import { Currency } from '../data/currencies';
import { convertCurrency } from '../services/ratesService';
import { getFXAdvice, FXAdviceResponse } from '../services/geminiAdvisor';

interface AIAdvisorProps {
  rates: Record<string, number>;
  fromCurrency: Currency;
  toCurrency: Currency;
  onOpenToModal: () => void;
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({
  rates,
  fromCurrency,
  toCurrency,
  onOpenToModal,
}) => {
  const [amount, setAmount] = useState<number>(2000);
  const [purpose, setPurpose] = useState<'travel' | 'investment' | 'remittance' | 'shopping' | 'general'>('travel');
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [advice, setAdvice] = useState<FXAdviceResponse | null>(null);

  const { rate: currentRate } = convertCurrency(1, fromCurrency.code, toCurrency.code, rates);

  const handleAskAdvice = async (customQ?: string) => {
    setLoading(true);
    try {
      const result = await getFXAdvice({
        fromCurrency: fromCurrency.code,
        toCurrency: toCurrency.code,
        amount,
        currentRate,
        purpose,
        userQuestion: customQ || userQuestion,
      });
      setAdvice(result);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    { label: `Visiting ${toCurrency.country} next week`, q: `I am travelling to ${toCurrency.country} in 7 days with a budget of ${amount} ${fromCurrency.code}. Should I exchange physical cash now or use multi-currency debit cards?` },
    { label: 'Is the current rate at a good entry point?', q: `Based on current MAS and market levels, is 1 ${fromCurrency.code} = ${currentRate.toFixed(4)} ${toCurrency.code} a historically favorable rate to convert?` },
    { label: 'How to avoid bank transfer fees?', q: `What is the cheapest way to transfer ${amount} ${fromCurrency.code} into ${toCurrency.code} without paying high bank spreads?` },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              FX Timing & Channel Advisor
            </h2>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Smart analysis of exchange timing, physical vs digital spreads, and local channels</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-2 shrink-0 self-start sm:self-auto">
            <span className="text-xs text-slate-400 pl-2">Pair:</span>
            <span className="text-sm font-semibold text-white">
              {fromCurrency.code} → {toCurrency.code}
            </span>
            <button
              onClick={onOpenToModal}
              className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-slate-800 rounded-lg transition-colors"
            >
              Change
            </button>
          </div>
        </div>

        {/* Input Parameters */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">
              Conversion Amount ({fromCurrency.code})
            </label>
            <input
              type="number"
              min="100"
              step="100"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500/80"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-medium">Primary Intent</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as any)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/80"
            >
              <option value="travel">Overseas Holiday / Travel</option>
              <option value="shopping">Cross-Border E-Commerce Shopping</option>
              <option value="remittance">Overseas Family Remittance / Tuition</option>
              <option value="investment">FX Investment / Multi-Currency Holding</option>
              <option value="general">General Cash Exchange</option>
            </select>
          </div>
        </div>

        {/* Custom Question input */}
        <div className="mt-4">
          <label className="text-xs text-slate-400 block mb-1.5 font-medium">
            Ask specific question (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Should I change S$2,000 now or exchange across the border?"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80"
            />
            <button
              onClick={() => handleAskAdvice()}
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 shrink-0"
            >
              {loading ? (
                <span>Analyzing...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sample preset prompts */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs text-slate-400 shrink-0">Try asking:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setUserQuestion(p.q);
                handleAskAdvice(p.q);
              }}
              className="px-3 py-1 text-xs rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Advice Result Card */}
        {advice && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
            {/* Header Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    advice.timingAdvice === 'Favorable to Exchange'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : advice.timingAdvice === 'Neutral / Hold'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-indigo-500/20 text-indigo-400'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Timing Assessment</div>
                  <div className="text-sm font-bold text-white">{advice.timingAdvice}</div>
                </div>
              </div>

              <div className="text-xs text-slate-400 sm:text-right">
                <div>Spot Benchmark</div>
                <div className="font-mono font-bold text-white tabular-nums">
                  1 {fromCurrency.code} = {currentRate.toFixed(4)} {toCurrency.code}
                </div>
              </div>
            </div>

            {/* Summary & Recommendation */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                {advice.summary}
              </p>

              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  Tactical Recommendation:
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {advice.recommendation}
                </p>
              </div>

              <div className="pt-2 text-xs text-slate-400 flex items-center gap-1.5">
                <span className="font-semibold text-slate-300">Recommended Channel:</span>
                <span className="text-emerald-300">{advice.bestChannel}</span>
              </div>
            </div>

            {/* Tips List */}
            {advice.tips && advice.tips.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
                <div className="text-xs font-semibold text-slate-200 mb-2.5 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Practical FX Tips:
                </div>
                <ul className="space-y-2">
                  {advice.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
