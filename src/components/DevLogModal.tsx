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
              {/* v1.8.6 */}
              <div className="p-3.5 rounded-xl border border-emerald-400 bg-emerald-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 text-sm">
                    v1.8.6 (黑板直式板書排版 100% 依實圖校正：徹底解決座號橫向排開問題，完美還原圖一垂直板書與冒號對齊續行)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-full font-bold">
                    最新版本
                  </span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                  <li><strong>📷 100% 精準對照圖一實作：</strong> 徹底解決先前因 Flex 佈局方向衝突導致座號橫向排開的問題（圖二），全面回歸原生垂直書寫流。</li>
                  <li><strong>⬇️ 直式垂直板書書寫：</strong> 標題、冒號、座號（縱中橫排）與頓號由上至下垂直排成一行，工整美觀。</li>
                  <li><strong>📏 圖一續行冒號對齊懸掛：</strong> 座號換行時，第二行頂部設置與標題等長的隱形 Spacer，第二行第一個座號直接從冒號左側接續、完全對齊冒號後第一個數字！</li>
                  <li><strong>。 句號完美結尾：</strong> 全部座號完成後，最後結尾必定以全形中文句號「。」作結。</li>
                </ul>
              </div>

              {/* v1.8.5 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    v1.8.5 (排版與換行懸掛縮排全面優化)
                  </span>
                  <span className="text-[10px] text-slate-400">2026-10-19</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                  <li><strong>🎨 恢復原版流暢字體：</strong> 依使用者回饋撤回實驗性幾何標點，恢復最清晰美觀的原生系統字體系統，維持純座號清爽呈現。</li>
                  <li><strong>⬆️ 隱藏工具列黑板文字自動上移：</strong> 修正工具列折疊時仍占位的問題，收起工具列後文字平滑上移，去除上方多餘突兀留白。</li>
                  <li><strong>📐 黑板預留充裕安全邊界：</strong> 底部預留至少 56px 的黑板綠呼吸空間，徹底杜絕文字切半或感覺下方被吃掉的問題。</li>
                  <li><strong>📏 座號換行懸掛縮排：</strong> 單項作業欠交人數過多折至左側第二行時，自動設置等高 Spacer，第二行第一個座號精準從冒號左側接續、水平對齊冒號後第一個數字！</li>
                  <li><strong>。 全體座號句號作結：</strong> 每項作業座號最後一個號碼後方必定以全形中文句號「。」作結，排版規範工整規範。</li>
                </ul>
              </div>

              {/* v1.8.4 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    v1.8.4 (標點置中實驗版本)
                  </span>
                  <span className="text-[10px] text-slate-400">2026-10-19</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                  <li><strong>🎯 冒號（：）與頓號（、）100% 絕對置中：</strong> 克服不同作業系統字型標點度量偏左偏右的問題，採用精確中心幾何定位元件，保證冒號兩點與頓號斜筆永遠精準對齊直行正中心線。</li>
                  <li><strong>📏 連字號（-）中軸垂直對齊：</strong> 標題如「L3 - 1」之連字號亦全面套用中心幾何校準，中軸直線筆直無偏差。</li>
                  <li><strong>🖋️ 黑板字型自由切換：</strong> 工具列提供「黑體」與「楷體」隨心切換，滿足不同大螢幕投影之觀看偏好。</li>
                </ul>
              </div>

              {/* v1.8.3 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    v1.8.3 (字體升級與標點置中：冒號與頓號完全置中 ＆ 導入教育部標準字型切換 ＆ 移除顯示名字功能)
                  </span>
                  <span className="text-[10px] text-slate-400">2026-10-19</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                  <li><strong>🎯 冒號（：）與頓號（、）完全置中：</strong> 採用台灣教育部標準排版規範之 Noto Sans TC 與正統標楷體，搭配專屬直式標點置中樣式，冒號與頓號精準置中於直行軸線上。</li>
                  <li><strong>🖋️ 黑板字型一鍵切換（黑體 / 楷體）：</strong> 工具列支援切換「黑體（現代粉筆）」與「楷體（傳統課堂正楷）」，方便老師依投影設備與偏好自由選擇。</li>
                  <li><strong>✨ 移除顯示名字功能：</strong> 介面精簡回歸純座號模式，移除姓名顯示開關，視覺更乾淨俐落。</li>
                </ul>
              </div>

              {/* v1.8.2 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    v1.8.2 (黑板版面精準校準：解決作業名稱串連堆疊，1:1 還原每項作業獨立直行與自動跳列折行)
                  </span>
                  <span className="text-[10px] text-slate-400">2026-10-19</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                  <li><strong>🎯 徹底解決作業名稱串連堆疊問題：</strong> 修正先前作業標題被擠在最右側同一欄的問題，現每項作業皆為完全獨立垂直欄位，由右往左依序書寫，第一項作業永遠位於黑板最右側。</li>
                  <li><strong>↩️ 自動跳下一行（智慧直行折列）精準生效：</strong> 單一作業欠交座號過多時，CSS 垂直流自動向左側「折至下一行」繼續接續書寫座號；結束後下一項作業再開啟獨立直行。</li>
                  <li><strong>🔤 英數代碼與座號縱中橫排（Tate-chū-yoko）完全修復：</strong> <code>L3</code>、<code>14</code>、<code>16</code>、<code>25</code> 等英數代號水平橫排於單一漢字寬度方框中，與漢字及標點正立流暢銜接，100% 符合真實黑板照片。</li>
                  <li><strong>🖼️ 真實黑板底圖無縫嵌入：</strong> 直接從您提供的範本照片中精確提取無文字之純淨黑板綠粉筆紋理，呈現最自然的課堂黑板氛圍。</li>
                </ul>
              </div>

              {/* v1.8.1 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    v1.8.1 (黑板排版重構：依現場實圖打造連續直式書寫、英文數字自動縱中橫排、超長自動跳列折行)
                  </span>
                  <span className="text-[10px] text-slate-400">2026-10-19</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                  <li><strong>📷 1:1 還原真實黑板畫面：</strong> 依照教室現場實體黑板版面重構，深色黑板背景配純粉筆字，呈現「<code>作業名稱：座號、座號...</code>」連續直式句子。</li>
                  <li><strong>🔤 英文與數字自動旋轉為橫排：</strong> 英文、章節編號（如 <code>L3-1</code>）與數字座號（如 <code>14</code>、<code>16</code>、<code>25</code>）自動水平橫排（縱中橫排），漢字與標點正立。</li>
                </ul>
              </div>

              {/* v1.8.0 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    v1.8.0 (重大功能：黑板缺交登記榜 ＆ 中文直式排版 ＆ 遠距超大字體 ＆ 大螢幕全螢幕投影)
                  </span>
                  <span className="text-[10px] text-slate-400">2026-10-19</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                  <li><strong>🏫 仿真黑板缺交登記榜：</strong> 沉浸式墨綠黑板質感、原木飾邊與粉筆槽，直覺呈現全班全部作業之缺交內容與座號清單。</li>
                  <li><strong>📜 正統中文直式書寫排版：</strong> 依照台灣黑板聯絡簿格式，直行由右至左、由上而下排列，亦可切換直式由左至右或橫式。</li>
                  <li><strong>🔍 遠距超大字體（後排清晰可見）：</strong> 提供標準 (24px)、大字 (32px)、特大 (42px) 與超大遠距 (56px~72px) 四段自由縮放，黃色粉筆高對比座號一目了然。</li>
                  <li><strong>⛶ 大螢幕全螢幕投影 ＆ 點擊銷案：</strong> 一鍵進入投影模式，在觸控大螢幕點選座號即可直接標記為已交，並即時同步至雲端。</li>
                </ul>
              </div>

              {/* v1.7.3 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    v1.7.3 (教學現場優化：座位表視角與講台位置連動對調 ＆ 自由切換講台上下方方位)
                  </span>
                  <span className="text-[10px] text-slate-400">2026-10-18</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                  <li><strong>🏫 講台位置與視角智慧連動對調：</strong> 切換「從講台往下看」時，講台自動對調至畫面下方（代表老師站在講台前，眼前為第一排學生俯瞰全班）；切換「從學生方向看」時，講台自動對調至畫面上方（學生面對前方黑板）。</li>
                  <li><strong>↕️ 講台位置自由對調切換鈕：</strong> 工具列提供「講台在下方 / 講台在上方」一鍵對調按鈕，完全符合老師不同上課站位習慣或黑板掛設環境。</li>
                  <li><strong>🏷️ 排數標籤與方位智慧綁定：</strong> 最靠近講台之列動態標註「第 1 列 (最前排·靠近講台)」，靠門之列標註「最後排·靠後門」，排數清晰不混淆。</li>
                  <li><strong>🔒 換座位全功能教師防呆守門：</strong> 調整座位模式深度納入教師密碼保護，嚴防大螢幕課堂誤觸；對調演算法支援任意視角與方位。</li>
                </ul>
              </div>

              {/* v1.7.2 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    v1.7.2 (關鍵修復：初次換位座號變空位問題 ＆ 換座位功能納入教師權限管理)
                  </span>
                  <span className="text-[10px] text-slate-400">2026-10-18</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                  <li><strong>🎯 換位防消失修復：</strong> 徹底解決首次點換位置時兩位學生變成空位的索引覆蓋問題，確保點選任意兩人課桌皆能 100% 準確對調。</li>
                  <li><strong>🔒 密碼防呆保護：</strong> 換座位功能納入教師權限管理，非解鎖狀態顯示為「🔒 調整座位 (需教師權限)」，點擊提示輸入密碼。</li>
                </ul>
              </div>

              {/* v1.7.0 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    v1.7.0 (重大功能：教室座位表顯示模式 ＆ 雙向視角切換 ＆ 大字體寬格優化)
                  </span>
                  <span className="text-[10px] text-slate-400">2026-10-18</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                  <li><strong>🪑 教室座位表模式：</strong> 依照教室格局排列學生座位，支援 4~7 縱行與直排/橫排切換。</li>
                  <li><strong>👀 雙向視角切換：</strong> 支援「從講台往下看」與「從學生方向看」兩種視角。</li>
                  <li><strong>🔤 大字體寬格優化：</strong> 座號放大至 text-3xl~4xl 超粗體，站距 5 公尺遠依然極度清晰。</li>
                </ul>
              </div>

              {/* v1.6.0 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    v1.6.0 (重大功能：作業同步即時固化 ＆ 教師管理密碼防呆分權體系)
                  </span>
                  <span className="text-[10px] text-slate-400">2026-10-18</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
                  <li><strong>☁️ 加入連線作業即時固化：</strong> 解決連線模式下新增作業按 F5 消失之問題，新增作業即刻寫入雲端房間。</li>
                  <li><strong>🔐 教師密碼分權防護：</strong> 大螢幕/小老師版僅開放批改與新增作業，防止誤刪資料或誤改設定；教師輸入密碼（預設 8888）即可解鎖全功能。</li>
                </ul>
              </div>

              {/* v1.2.1 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
                    v1.2.1 (關鍵修復：座號刪除直覺化、徹底移除阻塞式彈窗、班級人數一鍵裁切)
                  </span>
                  <span className="text-[10px] text-slate-400">2026-10-13</span>
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
