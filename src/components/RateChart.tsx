import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, ArrowRight } from 'lucide-react';
import { Currency } from '../data/currencies';
import { convertCurrency, generateHistoricalData } from '../services/ratesService';

interface RateChartProps {
  rates: Record<string, number>;
  baseCurrency: Currency;
  targetCurrency: Currency;
  onOpenBaseModal: () => void;
  onOpenTargetModal: () => void;
}

export const RateChart: React.FC<RateChartProps> = ({
  rates,
  baseCurrency,
  targetCurrency,
  onOpenBaseModal,
  onOpenTargetModal,
}) => {
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { rate: currentSpotRate } = convertCurrency(1, baseCurrency.code, targetCurrency.code, rates);

  const { points, minRate, maxRate, changePercent } = useMemo(() => {
    return generateHistoricalData(currentSpotRate, timeframe);
  }, [currentSpotRate, timeframe]);

  // SVG viewBox metrics
  const width = 800;
  const height = 280;
  const paddingX = 40;
  const paddingY = 30;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const range = maxRate - minRate || 1;

  const svgPoints = useMemo(() => {
    return points.map((p, index) => {
      const x = paddingX + (index / (points.length - 1)) * chartWidth;
      const normalizedY = (p.rate - minRate) / range;
      const y = height - paddingY - normalizedY * chartHeight;
      return { x, y, date: p.date, rate: p.rate };
    });
  }, [points, minRate, range, chartWidth, chartHeight, height, paddingX, paddingY]);

  const pathD = useMemo(() => {
    if (svgPoints.length === 0) return '';
    return svgPoints.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }, [svgPoints]);

  const areaD = useMemo(() => {
    if (svgPoints.length === 0) return '';
    const firstX = svgPoints[0].x;
    const lastX = svgPoints[svgPoints.length - 1].x;
    const bottomY = height - paddingY;
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [pathD, svgPoints, height, paddingY]);

  const isPositive = changePercent >= 0;
  const activePoint = hoveredIndex !== null ? svgPoints[hoveredIndex] : svgPoints[svgPoints.length - 1];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Header with pair picker and timeframe buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenBaseModal}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-semibold text-sm transition-colors"
              >
                <span>{baseCurrency.flag}</span>
                <span>{baseCurrency.code}</span>
              </button>

              <ArrowRight className="w-4 h-4 text-slate-400" />

              <button
                onClick={onOpenTargetModal}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-semibold text-sm transition-colors"
              >
                <span>{targetCurrency.flag}</span>
                <span>{targetCurrency.code}</span>
              </button>
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-white">
                {activePoint?.rate.toFixed(4)}
              </span>
              <div
                className={`flex items-center gap-1 text-sm font-semibold font-mono tabular-nums ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>
                  {isPositive ? '+' : ''}
                  {changePercent.toFixed(2)}% ({timeframe})
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Reference date: {activePoint?.date}</span>
            </div>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl shrink-0 self-start lg:self-auto">
            {(['7D', '30D', '90D', '1Y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  setHoveredIndex(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  timeframe === tf
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* High / Low / 52W Range Bar */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-800/80 text-xs">
          <div>
            <div className="text-slate-400">Period Low</div>
            <div className="text-sm sm:text-base font-mono font-bold text-white tabular-nums mt-0.5">
              {minRate.toFixed(4)}
            </div>
          </div>

          <div>
            <div className="text-slate-400">Period High</div>
            <div className="text-sm sm:text-base font-mono font-bold text-white tabular-nums mt-0.5">
              {maxRate.toFixed(4)}
            </div>
          </div>

          <div>
            <div className="text-slate-400">Spread Volatility</div>
            <div className="text-sm sm:text-base font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
              {(((maxRate - minRate) / minRate) * 100).toFixed(2)}%
            </div>
          </div>

          <div>
            <div className="text-slate-400">MAS Mid-Market Reference</div>
            <div className="text-sm sm:text-base font-mono font-bold text-slate-200 tabular-nums mt-0.5">
              {currentSpotRate.toFixed(4)}
            </div>
          </div>
        </div>

        {/* SVG Interactive Chart */}
        <div className="mt-6 w-full overflow-hidden">
          <div className="relative w-full aspect-[21/9] sm:aspect-[24/9]">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full overflow-visible"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const y = height - paddingY - pct * chartHeight;
                const value = minRate + pct * range;
                return (
                  <g key={pct}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="rgba(51, 65, 85, 0.3)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={width - paddingX + 8}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {value.toFixed(4)}
                    </text>
                  </g>
                );
              })}

              {/* Area fill */}
              <path d={areaD} fill="url(#chartGradient)" />

              {/* Main curve line */}
              <path
                d={pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Hover indicator */}
              {activePoint && (
                <g>
                  <line
                    x1={activePoint.x}
                    y1={paddingY}
                    x2={activePoint.x}
                    y2={height - paddingY}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Invisible interactive hover bars across points */}
              {svgPoints.map((pt, idx) => {
                const segWidth = chartWidth / svgPoints.length;
                return (
                  <rect
                    key={idx}
                    x={pt.x - segWidth / 2}
                    y={0}
                    width={segWidth}
                    height={height}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
