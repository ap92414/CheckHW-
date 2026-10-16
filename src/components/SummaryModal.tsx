import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, Sparkles } from 'lucide-react';
import { ClassRecord, AssignmentRecord, SummaryFormat } from '../types';
import { SummaryStats, generateSummaryText } from '../utils/formatSummary';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClass: ClassRecord;
  activeAssignment: AssignmentRecord;
  stats: SummaryStats;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  activeClass,
  activeAssignment,
  stats,
}) => {
  const [format, setFormat] = useState<SummaryFormat>('detailed');
  const [pendingTerm, setPendingTerm] = useState<'缺交' | '未交'>('缺交');
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);

  // Update text when format, term, assignment, or stats change
  useEffect(() => {
    if (activeClass && activeAssignment) {
      const generated = generateSummaryText(format, activeClass, activeAssignment, stats, pendingTerm);
      setCustomText(generated);
    }
  }, [format, pendingTerm, activeClass, activeAssignment, stats]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = customText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${activeClass.name} ${activeAssignment.title} 作業清查`,
          text: customText,
        });
      } catch {
        // User cancelled share
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-1.5">
              <span>作業繳交文字摘要</span>
            </h2>
            <p className="text-xs text-slate-500">
              {activeClass.name} · {activeAssignment.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector & Terminology Toggle */}
        <div className="p-3 border-b border-slate-100 bg-white space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-700">
              選擇訊息格式：
            </label>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400">用詞偏好：</span>
              <button
                type="button"
                onClick={() => setPendingTerm('缺交')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  pendingTerm === '缺交'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                缺交
              </button>
              <button
                type="button"
                onClick={() => setPendingTerm('未交')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  pendingTerm === '未交'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                未交
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            <button
              onClick={() => setFormat('detailed')}
              className={`px-2.5 py-1.5 rounded-lg border text-center transition-all ${
                format === 'detailed'
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              完整報告
            </button>
            <button
              onClick={() => setFormat('compact')}
              className={`px-2.5 py-1.5 rounded-lg border text-center transition-all ${
                format === 'compact'
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              精簡版
            </button>
            <button
              onClick={() => setFormat('pending-only')}
              className={`px-2.5 py-1.5 rounded-lg border text-center transition-all ${
                format === 'pending-only'
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              僅{pendingTerm}名單
            </button>
            <button
              onClick={() => setFormat('need-fix-only')}
              className={`px-2.5 py-1.5 rounded-lg border text-center transition-all ${
                format === 'need-fix-only'
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              僅需訂正
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="relative">
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={8}
              className="w-full text-xs sm:text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 leading-relaxed focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all"
              placeholder="產生的文字摘要..."
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            * 內容可直接在此編輯或加入叮嚀事項，再進行複製。座號依數字順序排列。
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          {typeof navigator !== 'undefined' && 'share' in navigator ? (
            <button
              onClick={handleNativeShare}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>系統分享</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl"
            >
              關閉
            </button>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>已複製到剪貼簿！可直接貼至 LINE</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>一鍵複製摘要</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
