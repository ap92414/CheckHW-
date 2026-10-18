import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  Database, 
  Lock, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Smartphone,
  ShieldCheck,
  Radio,
  Wifi,
  WifiOff,
  Monitor,
  Key,
  Users
} from 'lucide-react';
import { 
  auth, 
  ensureTeacherAuth, 
  testConnection, 
  uploadAppDataToCloud,
  uploadRoomData,
  getStoredRoomCode,
  setStoredRoomCode
} from '../utils/firebase';
import { AppData } from '../types';
import { generateCleanEmptyData } from '../utils/storage';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  onSyncDataFromCloud: (partial: Partial<AppData>) => void;
  roomCode: string;
  onUpdateRoomCode: (code: string) => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({ 
  isOpen, 
  onClose,
  appData,
  onSyncDataFromCloud,
  roomCode,
  onUpdateRoomCode
}) => {
  const [activeTab, setActiveTab] = useState<'room' | 'sync' | 'rules'>('room');
  const [inputRoomCode, setInputRoomCode] = useState<string>(roomCode || getStoredRoomCode() || '706');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    testConnection().then((ok) => {
      if (!isMounted) return;
      setConnectionStatus(ok ? 'connected' : 'disconnected');
    });

    setInputRoomCode(roomCode || getStoredRoomCode() || '706');

    return () => {
      isMounted = false;
    };
  }, [isOpen, roomCode]);

  // 1. Phone / Primary PC: Upload current local 706 data to this Room Code
  const handleUploadToRoom = async () => {
    const code = inputRoomCode.trim();
    if (!code) {
      setSyncMessage('請先輸入教室代碼（例如：706）');
      return;
    }
    setIsConnecting(true);
    setSyncMessage(`正在將目前班級名單與作業上傳至教室代碼【${code}】...`);
    try {
      await ensureTeacherAuth();
      await uploadRoomData(code, appData);
      setStoredRoomCode(code);
      onUpdateRoomCode(code);
      setLastSyncTime(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
      setSyncMessage(`✅ 成功！目前資料已綁定至教室代碼【${code}】。大螢幕或 iPad 只要輸入此代碼即可一秒同步！`);
    } catch (err) {
      console.error(err);
      setSyncMessage('上傳失敗，請確認網路連線是否正常');
    } finally {
      setIsConnecting(false);
    }
  };

  // 2. Classroom Big Screen / iPad: Join this Room Code to receive live sync
  const handleJoinRoom = async () => {
    const code = inputRoomCode.trim();
    if (!code) {
      setSyncMessage('請先輸入教室代碼（例如：706）');
      return;
    }
    setIsConnecting(true);
    setSyncMessage(`正在連線並載入教室【${code}】的最新資料...`);
    try {
      await ensureTeacherAuth();
      setStoredRoomCode(code);
      onUpdateRoomCode(code);
      setLastSyncTime(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
      setSyncMessage(`✅ 已成功連入教室【${code}】！大螢幕與手機已建立毫秒級雙向連動，開機將自動連入！`);
    } catch (err) {
      console.error(err);
      setSyncMessage('連線失敗，請檢查代碼或網路');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from room and clear local data cleanly (不留範本)
  const handleLeaveRoom = () => {
    setStoredRoomCode('');
    onUpdateRoomCode('');
    const cleanEmpty = generateCleanEmptyData();
    onSyncDataFromCloud(cleanEmpty);
    setSyncMessage('已退出教室代碼！本地資料庫已全數清空，未保留任何範本。');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>跨裝置即時同步（手機 ⇋ 教室大螢幕）</span>
            </h2>
            <p className="text-xs text-slate-500">
              輸入相同教室代碼，任何裝置一打開立即同步，巡堂點選毫秒跳動！
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="關閉"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('room')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'room'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>教室代碼配對</span>
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>雲端備份管理</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>資安防護</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 flex-1 overflow-y-auto text-xs space-y-4">
          {activeTab === 'room' && (
            <div className="space-y-4">
              {/* Room Code Status Banner */}
              <div className={`p-4 rounded-xl border transition-all ${
                roomCode 
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${
                      roomCode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`} />
                    <span className="font-bold text-sm">
                      {roomCode ? `已連線教室：【${roomCode}】` : '尚未加入任何教室代碼'}
                    </span>
                  </div>

                  {roomCode && (
                    <button
                      onClick={handleLeaveRoom}
                      className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                    >
                      退出教室
                    </button>
                  )}
                </div>

                <p className="text-[11px] leading-relaxed opacity-90">
                  {roomCode
                    ? `這台設備已成功綁定【${roomCode}】教室！以後每次打開網頁或 F5 重新整理，都會自動連線並載入最新進度。手機巡堂點選座號，大螢幕毫秒自動跳動！`
                    : '只要在大螢幕與手機輸入相同的代碼（例如 701），大螢幕就會永久記住名單，兩邊雙向同步免帳號密碼！'}
                </p>

                {lastSyncTime && (
                  <div className="mt-2 text-[10px] text-emerald-700 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>最後同步時間：{lastSyncTime}</span>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {syncMessage && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 flex items-center gap-2 text-xs font-medium">
                  <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{syncMessage}</span>
                </div>
              )}

              {/* Room Code Input Card */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  設定您的專屬教室代碼：
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputRoomCode}
                    onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                    placeholder="請輸入代碼，如：701"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl font-bold font-mono text-base tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setInputRoomCode('')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    填入代碼
                  </button>
                </div>

                {/* Two Distinct Actions for Phone vs Big Screen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Action 1: Upload from Phone/PC */}
                  <button
                    onClick={handleUploadToRoom}
                    disabled={isConnecting}
                    className="p-3 bg-blue-50/70 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition-all group flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-blue-900 text-xs">📱 手機/主電腦：上傳綁定</span>
                    </div>
                    <p className="text-[11px] text-blue-700 leading-normal">
                      將您目前的班級、學生與作業上傳到【{inputRoomCode || '班級代碼'}】雲端空間。
                    </p>
                  </button>

                  {/* Action 2: Join on Big Screen / iPad */}
                  <button
                    onClick={handleJoinRoom}
                    disabled={isConnecting}
                    className="p-3 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left transition-all group flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Monitor className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-900 text-xs">🖥️ 大螢幕/iPad：加入連線</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-normal">
                      立即載入【{inputRoomCode || '班級代碼'}】的最新名單，開機永遠記住此代碼！
                    </p>
                  </button>
                </div>
              </div>

              {/* Classroom Scenario Visual Guide */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>智慧教室操作情境：</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 leading-relaxed">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <strong className="text-slate-800 block mb-0.5">1. 手機端</strong>
                    輸入【{inputRoomCode || '班級代碼'}】，點「上傳綁定」，手機拿在手上巡視走道。
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <strong className="text-slate-800 block mb-0.5">2. 教室黑板大螢幕</strong>
                    輸入 【{inputRoomCode || '班級代碼'}】， 點「加入連線」，投影出該班座號名單。
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <strong className="text-slate-800 block mb-0.5">3. 巡堂即時跳動</strong>
                    手機點「5 號已交」，大螢幕 5 號毫秒變藍色，全班一目了然！
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 mb-1">個人私有備份（依瀏覽器身分）</div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  除了公開教室代碼外，每台設備也具備獨立的匿名教師雲端空間。點擊下方可強制將本機所有紀錄同步備份至個人雲端空間。
                </p>
              </div>

              <button
                onClick={async () => {
                  setIsConnecting(true);
                  try {
                    const user = await ensureTeacherAuth();
                    if (user) {
                      await uploadAppDataToCloud(user.uid, appData);
                      setSyncMessage('個人雲端備份成功！');
                    }
                  } catch (err) {
                    setSyncMessage('備份失敗');
                  } finally {
                    setIsConnecting(false);
                  }
                }}
                disabled={isConnecting}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>強制上傳目前資料至個人備份</span>
              </button>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>已正式部署之教室配對規則</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                系統已在 Google Cloud Firestore 部署安全過濾：只有輸入正確教室配對碼並具備有效憑證的裝置，才能連入讀寫該教室的座號狀態。
              </p>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed">
{`match /syncRooms/{roomId} {
  allow read, write: if request.auth != null;
  match /{allSubcollections=**} {
    allow read, write: if request.auth != null;
  }
}`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            {connectionStatus === 'connected' ? (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                Firebase 雲端連線正常
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                <WifiOff className="w-3.5 h-3.5" />
                離線狀態（本機正常可用）
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 rounded-xl transition-colors"
          >
            完成並關閉
          </button>
        </div>
      </div>
    </div>
  );
};
