import React from 'react';
import { Copy, Share2, CheckCircle2, AlertCircle, CircleDot } from 'lucide-react';
import { SummaryStats } from '../utils/formatSummary';

interface StatsBarProps {
  stats: SummaryStats;
  onOpenSummary: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, onOpenSummary }) => {
  const { total, completed, pending, needFix, completedPercent } = stats;

  const completedWidth = total > 0 ? (completed / total) * 100 : 0;
  const needFixWidth = total > 0 ? (needFix / total) * 100 : 0;
  const pendingWidth = total > 0 ? (pending / total) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 sm:p-4">
      {/* Top: 4 Stat Numbers + Copy Summary Button */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 flex-1 min-w-[280px]">
            {/* Total */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
              <div className="text-[11px] sm:text-xs font-medium text-slate-500">
                應交人數
              </div>
              <div className="text-base sm:text-xl font-bold text-slate-800">
                {total}
              </div>
            </div>

            {/* Completed */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-2 text-center">
              <div className="text-[11px] sm:text-xs font-semibold text-blue-700 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-blue-600 hidden xs:inline" />
                已交
              </div>
              <div className="text-base sm:text-xl font-bold text-blue-700">
                {completed}
              </div>
            </div>

            {/* Pending / Missing */}
            <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 text-center">
              <div className="text-[11px] sm:text-xs font-semibold text-slate-700 flex items-center justify-center gap-1">
                <CircleDot className="w-3 h-3 text-slate-500 hidden xs:inline" />
                缺交 / 未交
              </div>
              <div className="text-base sm:text-xl font-bold text-slate-800">
                {pending}
              </div>
            </div>

            {/* Need-Fix */}
            <div className="bg-rose-50/80 border border-rose-200/80 rounded-lg p-2 text-center">
              <div className="text-[11px] sm:text-xs font-semibold text-rose-700 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-600 hidden xs:inline" />
                需訂正
              </div>
              <div className="text-base sm:text-xl font-bold text-rose-700">
                {needFix}
              </div>
            </div>
          </div>

          {/* Action button: LINE Summary */}
          <button
            onClick={onOpenSummary}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-xs shrink-0 w-full sm:w-auto"
          >
            <Copy className="w-4 h-4" />
            <span>產生 LINE 摘要</span>
          </button>
        </div>

        {/* Bottom: Visual Segmented Progress Bar */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>繳交進度</span>
            <span className="font-semibold text-slate-700">{completedPercent}% 完成</span>
          </div>
          <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${completedWidth}%` }}
              className="bg-blue-600 transition-all duration-300"
              title={`已交: ${completed} 人 (${Math.round(completedWidth)}%)`}
            />
            <div
              style={{ width: `${needFixWidth}%` }}
              className="bg-rose-500 transition-all duration-300"
              title={`需訂正: ${needFix} 人 (${Math.round(needFixWidth)}%)`}
            />
            <div
              style={{ width: `${pendingWidth}%` }}
              className="bg-slate-300 transition-all duration-300"
              title={`未交: ${pending} 人 (${Math.round(pendingWidth)}%)`}
            />
          </div>
        </div>
      </div>
  );
};
