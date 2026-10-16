import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { QuickConverter } from './components/QuickConverter';
import { ProviderComparison } from './components/ProviderComparison';
import { MultiBasket } from './components/MultiBasket';
import { CashPackCalculator } from './components/CashPackCalculator';
import { RateChart } from './components/RateChart';
import { AIAdvisor } from './components/AIAdvisor';
import { CurrencyModal } from './components/CurrencyModal';
import { GitSyncModal } from './components/GitSyncModal';
import { CURRENCIES, DEFAULT_SGD_RATES, Currency } from './data/currencies';
import { fetchExchangeRates } from './services/ratesService';
import { ArrowRight, GitBranch, Shield, Zap } from 'lucide-react';

export default function App() {
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_SGD_RATES);
  const [lastUpdated, setLastUpdated] = useState<string>('MAS Benchmark');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Active currencies
  const [fromCurrency, setFromCurrency] = useState<Currency>(CURRENCIES[0]); // SGD
  const [toCurrency, setToCurrency] = useState<Currency>(CURRENCIES[1]); // MYR
  const [baseCurrency, setBaseCurrency] = useState<Currency>(CURRENCIES[0]); // SGD

  // Active tab
  const [activeTab, setActiveTab] = useState<string>('converter');

  // Modals
  const [currencyModalType, setCurrencyModalType] = useState<'from' | 'to' | 'base' | null>(null);
  const [gitModalOpen, setGitModalOpen] = useState<boolean>(false);

  const loadRates = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchExchangeRates();
      setRates(data.rates);
      setLastUpdated(data.lastUpdated);
      setIsLive(data.isLive);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  const handleSelectCurrency = (selected: Currency) => {
    if (currencyModalType === 'from') {
      setFromCurrency(selected);
    } else if (currencyModalType === 'to') {
      setToCurrency(selected);
    } else if (currencyModalType === 'base') {
      setBaseCurrency(selected);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lastUpdated={lastUpdated}
        isLive={isLive}
        onRefreshRates={loadRates}
        isRefreshing={isRefreshing}
        onOpenGitModal={() => setGitModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Market Rate Ticker Strip */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold shrink-0">
            <Zap className="w-3.5 h-3.5" />
            <span>MAS FX BENCHMARK</span>
          </div>

          {[
            { pair: 'SGD/MYR', rate: rates.MYR || 3.524, flag: '🇲🇾' },
            { pair: 'SGD/JPY', rate: rates.JPY || 114.28, flag: '🇯🇵' },
            { pair: 'USD/SGD', rate: rates.USD ? (1 / rates.USD).toFixed(4) : '1.302', flag: '🇺🇸' },
            { pair: 'EUR/SGD', rate: rates.EUR ? (1 / rates.EUR).toFixed(4) : '1.420', flag: '🇪🇺' },
            { pair: 'GBP/SGD', rate: rates.GBP ? (1 / rates.GBP).toFixed(4) : '1.672', flag: '🇬🇧' },
            { pair: 'SGD/THB', rate: rates.THB || 27.85, flag: '🇹🇭' },
            { pair: 'SGD/AUD', rate: rates.AUD || 1.156, flag: '🇦🇺' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 shrink-0 tabular-nums hover:border-slate-700 transition-colors cursor-pointer"
              onClick={() => {
                if (item.pair === 'SGD/MYR') {
                  setFromCurrency(CURRENCIES[0]);
                  setToCurrency(CURRENCIES[1]);
                } else if (item.pair === 'SGD/JPY') {
                  setFromCurrency(CURRENCIES[0]);
                  setToCurrency(CURRENCIES[2]);
                } else if (item.pair === 'USD/SGD') {
                  setFromCurrency(CURRENCIES[3]);
                  setToCurrency(CURRENCIES[0]);
                }
                setActiveTab('converter');
              }}
            >
              <span>{item.flag}</span>
              <span className="font-semibold text-white">{item.pair}</span>
              <span className="text-emerald-400">
                {typeof item.rate === 'number' ? item.rate.toFixed(4) : item.rate}
              </span>
            </div>
          ))}
        </div>

        {/* View Routing */}
        {activeTab === 'converter' && (
          <QuickConverter
            rates={rates}
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
            setFromCurrency={setFromCurrency}
            setToCurrency={setToCurrency}
            onOpenFromModal={() => setCurrencyModalType('from')}
            onOpenToModal={() => setCurrencyModalType('to')}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'providers' && (
          <ProviderComparison
            rates={rates}
            targetCurrency={toCurrency}
            onOpenTargetModal={() => setCurrencyModalType('to')}
          />
        )}

        {activeTab === 'basket' && (
          <MultiBasket
            rates={rates}
            baseCurrency={baseCurrency}
            setBaseCurrency={setBaseCurrency}
            onOpenBaseModal={() => setCurrencyModalType('base')}
          />
        )}

        {activeTab === 'cashpack' && (
          <CashPackCalculator
            rates={rates}
            targetCurrency={toCurrency}
            onOpenTargetModal={() => setCurrencyModalType('to')}
          />
        )}

        {activeTab === 'trends' && (
          <RateChart
            rates={rates}
            baseCurrency={fromCurrency}
            targetCurrency={toCurrency}
            onOpenBaseModal={() => setCurrencyModalType('from')}
            onOpenTargetModal={() => setCurrencyModalType('to')}
          />
        )}

        {activeTab === 'advisor' && (
          <AIAdvisor
            rates={rates}
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
            onOpenToModal={() => setCurrencyModalType('to')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
              M
            </div>
            <span>
              MAS Exchanger · Singapore & Global Currency Platform
            </span>
          </div>

          <div className="text-center md:text-right max-w-md text-[11px] text-slate-500 leading-normal">
            Rates are updated periodically and reflect wholesale interbank reference rates. Physical money changer spreads (The Arcade, Chinatown, Mustafa) and bank fees are estimates for personal travel and commercial planning.
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setGitModalOpen(true)}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>chiayuting88-byte/mas-exchanger</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Currency Picker Modal */}
      <CurrencyModal
        isOpen={currencyModalType !== null}
        onClose={() => setCurrencyModalType(null)}
        onSelect={handleSelectCurrency}
        selectedCode={
          currencyModalType === 'from'
            ? fromCurrency.code
            : currencyModalType === 'to'
            ? toCurrency.code
            : baseCurrency.code
        }
        title={
          currencyModalType === 'from'
            ? 'Select Source Currency (You Pay)'
            : currencyModalType === 'to'
            ? 'Select Target Currency (You Receive)'
            : 'Select Base Basket Currency'
        }
      />

      {/* GitHub Sync Modal */}
      <GitSyncModal
        isOpen={gitModalOpen}
        onClose={() => setGitModalOpen(false)}
      />
    </div>
  );
}
