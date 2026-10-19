import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  Settings 
} from 'lucide-react';
import { 
  getStoredTeacherPassword, 
  setStoredTeacherPassword, 
  setIsTeacherUnlocked,
  getStoredRoomCode,
  uploadRoomData
} from '../utils/firebase';
import { AppData } from '../types';

interface TeacherPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  onUnlockSuccess: () => void;
  onLockSuccess: () => void;
  appData: AppData;
}

export const TeacherPasswordModal: React.FC<TeacherPasswordModalProps> = ({
  isOpen,
  onClose,
  isUnlocked,
  onUnlockSuccess,
  onLockSuccess,
  appData,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const currentCorrect = getStoredTeacherPassword();

    if (passwordInput.trim() === currentCorrect) {
      setIsTeacherUnlocked(true);
      onUnlockSuccess();
      setSuccessMessage('密碼正確！已解鎖教師完整管理權限');
      setTimeout(() => {
        setSuccessMessage('');
        setPasswordInput('');
        onClose();
      }, 1000);
    } else {
      setErrorMessage('密碼錯誤！請輸入正確的教師密碼（預設為 8888）');
    }
  };

  const handleLockAgain = () => {
    setIsTeacherUnlocked(false);
    onLockSuccess();
    setSuccessMessage('已鎖定為課堂/小老師模式');
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 800);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!newPassword.trim()) {
      setErrorMessage('新密碼不可為空');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('兩次輸入的新密碼不相符');
      return;
    }

    setStoredTeacherPassword(newPassword.trim());
    const roomCode = getStoredRoomCode();
    if (roomCode) {
      try {
        await uploadRoomData(roomCode, appData, newPassword.trim());
      } catch (err) {
        console.warn('Sync password to room notice:', err);
      }
    }

    setSuccessMessage('教師密碼已成功更新！');
    setIsChangingPass(false);
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setSuccessMessage('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isUnlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isUnlocked ? '教師管理者權限' : '解鎖教師管理權限'}
              </h2>
              <p className="text-xs text-slate-500">
                {isUnlocked ? '目前擁有全部管理與修改權限' : '小老師/大螢幕模式中，保護班級資料'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="關閉"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs">
          {successMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isUnlocked ? (
            /* Unlocking Form */
            <form onSubmit={handleUnlock} className="space-y-3.5">
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 leading-relaxed text-[11px]">
                🛡️ <strong>防呆保護中：</strong> 目前為課堂/大螢幕安全模式，已開放「<strong>新增作業</strong>」與「<strong>點已交/缺交/訂正</strong>」。名單設定、備份清空等進階功能需輸入教師密碼。
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  請輸入教師密碼：
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="預設密碼為 8888"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2 pl-9 bg-white border border-slate-300 rounded-xl font-mono text-sm tracking-widest focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  初始出廠預設密碼為：<code className="px-1 py-0.5 bg-slate-100 rounded text-slate-700 font-bold">8888</code>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  確認解鎖
                </button>
              </div>
            </form>
          ) : (
            /* Already Unlocked View */
            <div className="space-y-3.5">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 leading-relaxed text-[11px]">
                👑 <strong>您已擁有最高管理者權限！</strong><br />
                可自由調整班級學生、座號姓名、名單裁切、資料庫備份與重設。大螢幕使用完畢可點擊下方鎖定，防止同學或其他人誤刪。
              </div>

              {!isChangingPass ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingPass(true)}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-600" />
                    <span>修改教師密碼</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLockAgain}
                    className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>立刻鎖定為課堂/小老師模式</span>
                  </button>
                </div>
              ) : (
                /* Change Password Form */
                <form onSubmit={handleChangePasswordSubmit} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="font-bold text-slate-800 text-xs">設定新的教師密碼</div>
                  <div>
                    <input
                      type="password"
                      required
                      placeholder="輸入新密碼 (如 1234)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      required
                      placeholder="再次確認新密碼"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsChangingPass(false)}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-700 text-xs cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      儲存新密碼
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
