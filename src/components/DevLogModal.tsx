import React, { useState } from 'react';
import { X, BookOpen, Clock, CheckCircle, Lightbulb, Compass, FileText, ChevronRight } from 'lucide-react';

interface DevLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevLogModal: React.FC<DevLogModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'versions' | 'architecture' | 'roadmap'>('versions');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>CheckHW 研發日誌 (Development Log)</span>
            </h2>
            <p className="text-xs text-slate-500">
              記錄版本演進、教學現場回饋修正、架構決策與後續雲端規劃
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('versions')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'versions'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>版本演進紀錄</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>技術決策與現場解決</span>
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'roadmap'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>第二/三階段里程碑</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 flex-1 overflow-y-auto text-xs space-y-4">
          {activeTab === 'versions' && (
            <div className="space-y-4">
              {/* v1.2.1 */}
              <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-950 text-sm">
                    v1.2.1 (關鍵修復：座號刪除直覺化、徹底移除阻塞式彈窗、班級人數一鍵裁切)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-rose-600 text-white rounded-full font-bold">
                    最新版本
                  </span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                  <li><strong>🚫 徹底移除原生阻塞彈窗：</strong> 移除所有 <code>window.confirm</code> 與 <code>alert</code>，解決在 iFrame/手機瀏覽器中點擊刪除無反應之核心痛點。</li>
                  <li><strong>🗑️ 高辨識度紅色「刪除」按鈕：</strong> 每個座號皆擁有獨立紅色按鈕，點擊立即刪除並自動清理關聯作業紀錄，支援 1 鍵復原。</li>
                  <li><strong>⚡ 班級人數常用預設按鈕：</strong> 名單設定中新增 <code>[15人] [20人] [24人] [25人] [28人] [30人] [35人]</code> 常用人數，一鍵自動刪除多餘座號。</li>
                  <li><strong>☑️ 批次核選刪除：</strong> 支援一次勾選多個座號批次刪除，快速整理名單。</li>
                  <li><strong>📱 主畫面快選彈窗「刪除此號」：</strong> 在主作業清點畫面長按座號即可直接刪除該座號，狀態列亦新增「✂️ 調整班級人數」直達捷徑。</li>
                </ul>
              </div>

              {/* v1.2.0 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    v1.2.0 (現場優化：名單匯入、座號裁切、狀態雙顯與研發日誌)
                  </span>
                  <span className="text-[10px] text-slate-400">2026-10-13</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                  <li><strong>📥 批次名單匯入系統：</strong> 支援文字貼上或 CSV 上傳，自動辨識座號與姓名，免去逐一手動打字。</li>
                  <li><strong>✂️ 多餘座號刪除與裁切：</strong> 針對人數較少班級（如 15~20 人），提供個別座號垃圾桶刪除與「批次保留至 X 號」裁切功能。</li>
                  <li><strong>🏷️ 姓名與狀態文字雙顯修復：</strong> 徹底修正輸入學生姓名後「缺交/已交/需訂正」字樣消失的問題，兩者同時清晰呈現。</li>
                  <li><strong>📝 研發日誌留存：</strong> 完整留存開發紀錄至 <code>DEVELOPMENT_LOG.md</code> 與此研發彈窗。</li>
                </ul>
              </div>

              {/* v1.1.0 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    v1.1.0 (操作革新：四大直覺點法模式)
                  </span>
                  <span className="text-[10px] text-slate-400">2026-10-13</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
                  <li><strong>🔴 需訂正筆刷：</strong> 點選後輕觸座號直接標記需訂正，免去循環多按兩下的困擾。</li>
                  <li><strong>⚡ 智慧單擊模式：</strong> 中央切換已交/缺交，右上角 <strong>[!]</strong> 專門切換需訂正。</li>
                  <li><strong>📋 三合一快選彈窗：</strong> 手機長按、電腦按右鍵彈出直選菜單。</li>
                  <li><strong>LINE 用詞自訂：</strong> 支援切換「缺交名單」與「未交名單」。</li>
                </ul>
              </div>

              {/* v1.0.0 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    v1.0.0 (第一階段：全功能單一原型與本機持久化)
                  </span>
                  <span className="text-[10px] text-slate-400">2026-10-13</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
                  <li>班級、座號、作業管理與三態切換核心架構。</li>
                  <li>即時統計、多彩進度條、LINE 摘要數值嚴格排序與一鍵複製。</li>
                  <li><code>localStorage</code> 自動保存、Ctrl+Z 復原、JSON 備份與 Excel CSV 匯出。</li>
                  <li>單一獨立免安裝檔案 <code>standalone.html</code> 同步提供。</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 mb-1">原子化狀態紀錄 (Atomic Status Design)</div>
                <p className="text-slate-600 leading-relaxed">
                  作業繳交狀態採用 <code>statuses</code> 獨立資料表，每筆紀錄僅儲存單一學生在特定作業的狀態，而不是把整班包成一份大物件。這樣未來在第二階段串接 Firebase 時，多台裝置（如老師手機與小老師平板）同時點選不同座號不會互相覆蓋。
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 mb-1">嚴格數值排序演算法</div>
                <p className="text-slate-600 leading-relaxed">
                  座號統計與 LINE 摘要嚴格採用 <code>(a, b) =&gt; a - b</code> 數值由小至大排序，避免字串排序常見的「1, 10, 11, 2, 20」亂象，符合台灣校園教學規範。
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 mb-1">離線優先 (Offline-First) 本機保存</div>
                <p className="text-slate-600 leading-relaxed">
                  第一階段完全不依賴外部後端 API，即便在學校地下室或網路不穩的教室，依然保證所有操作 100% 毫秒級反應且重新整理不遺失。
                </p>
              </div>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-blue-900">
                <div className="font-bold">第二階段：Firebase Cloud Firestore 即時雙向同步</div>
                <ul className="list-disc pl-4 space-y-0.5 text-blue-800 text-[11px]">
                  <li>透過 Firebase Authentication 管理教師帳號。</li>
                  <li>使用 <code>onSnapshot</code> 雙向即時監聽（手機點選、電腦大螢幕同步變色）。</li>
                  <li>嚴格 Firestore Security Rules，保護學生隱私。</li>
                  <li>啟用離線快取佇列，斷網時照常點擊，連網後自動補送。</li>
                </ul>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-900">
                <div className="font-bold">第三階段：PWA 跨平台安裝與正式部署</div>
                <ul className="list-disc pl-4 space-y-0.5 text-emerald-800 text-[11px]">
                  <li>配置 <code>manifest.webmanifest</code>，支援手機/iPad「加入主畫面」。</li>
                  <li>配置 <code>service-worker.js</code>，快取核心離線資源。</li>
                  <li>提供教師端一鍵更新與安裝教學手冊。</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            檔案留存於根目錄：<code>DEVELOPMENT_LOG.md</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 rounded-xl"
          >
            關閉日誌
          </button>
        </div>
      </div>
    </div>
  );
};
