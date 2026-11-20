import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  CheckCircle2, 
  Lock, 
  UserCheck,
  BookOpen
} from 'lucide-react';
import { SystemSettings, User } from '../types';
import { storageService } from '../services/storageService';
import { MonitorCalculationKnowledgePanel } from '../components/settings/MonitorCalculationKnowledgePanel';

interface SystemSettingsViewProps {
  onNavigate?: (route: string) => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = () => {
  const [settings, setSettings] = useState<SystemSettings>(storageService.getSettings());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'THRESHOLDS' | 'CALCULATION_GUIDE'>('THRESHOLDS');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSettings(settings);
    if (settings.stageDisplayMode) {
      localStorage.setItem('findie_tv_layout_mode', settings.stageDisplayMode);
    }
    setSuccessMsg('บันทึกการตั้งค่าเกณฑ์และรูปแบบระบบเรียบร้อยแล้ว!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleResetSeed = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นจากไฟล์ Excel (31.01.2025)? ข้อมูลการแก้ไขและการป้อนสโตรกล่าสุดจะถูกกู้คืนเป็นค่าเริ่มต้นของโรงงาน')) {
      storageService.resetToSeedData();
      setSettings(storageService.getSettings());
      setSuccessMsg('รีเซ็ตข้อมูลระบบกลับสู่ชุดข้อมูล Excel (31.01.2025) สำเร็จแล้ว!');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="liquid-glass-card border border-white/10 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
            <span>ตั้งค่าระบบและเกณฑ์แจ้งเตือน (System Settings & Thresholds)</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            กำหนดค่าเกณฑ์แจ้งเตือนอายุแม่พิมพ์ (Life Thresholds) โหมดการแสดงผลหน้าจอ TV และกู้คืนชุดข้อมูลระบบ
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetSeed}
          className="liquid-pill flex items-center gap-2 px-5 py-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 font-bold rounded-full text-xs transition-all shadow font-mono cursor-pointer active:scale-95 shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          <span>RESET TO SEED DATA</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 rounded-2xl text-sm flex items-center gap-2.5 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sub-Function Tabs inside System Settings */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 border border-white/10 rounded-2xl w-fit max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('THRESHOLDS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'THRESHOLDS'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>ตั้งค่าเกณฑ์และหน้าจอ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('CALCULATION_GUIDE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-2 transition-colors cursor-pointer ${
            activeSubTab === 'CALCULATION_GUIDE'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>คลังความรู้หลักการคำนวณ Monitor</span>
        </button>
      </div>

      {activeSubTab === 'CALCULATION_GUIDE' ? (
        <MonitorCalculationKnowledgePanel settings={settings} />
      ) : (
      /* Settings Form: Life Percentage Thresholds */
      <div className="liquid-glass-card border border-white/10 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
            <h3 className="font-bold text-slate-100 border-b border-white/10 pb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
              <span>Life Percentage Thresholds (เกณฑ์ขีดจำกัดการแจ้งเตือนช็อตสะสม)</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-5 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-black/40 p-4 rounded-2xl border border-yellow-500/30 space-y-1.5">
                  <label className="block text-yellow-300 font-bold text-xs">
                    WARNING Threshold (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.warningThresholdPercent}
                    onChange={e => setSettings({ ...settings, warningThresholdPercent: parseInt(e.target.value, 10) || 70 })}
                    className="liquid-input w-full rounded-xl px-3 py-2 text-yellow-300 font-bold text-lg"
                  />
                  <div className="text-[10px] text-slate-400 font-thai">เตือนเริ่มต้น: ค่ามาตรฐาน 70% (เน้นแถบสีเหลือง)</div>
                </div>

                <div className="bg-black/40 p-4 rounded-2xl border border-amber-500/30 space-y-1.5">
                  <label className="block text-amber-400 font-bold text-xs">
                    PREPARE Threshold (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.prepareThresholdPercent}
                    onChange={e => setSettings({ ...settings, prepareThresholdPercent: parseInt(e.target.value, 10) || 85 })}
                    className="liquid-input w-full rounded-xl px-3 py-2 text-amber-400 font-bold text-lg"
                  />
                  <div className="text-[10px] text-slate-400 font-thai">เตรียมอะไหล่: ค่ามาตรฐาน 85% (เน้นแถบสีส้ม)</div>
                </div>

                <div className="bg-black/40 p-4 rounded-2xl border border-rose-500/30 space-y-1.5">
                  <label className="block text-rose-400 font-bold text-xs">
                    CRITICAL Threshold (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.criticalThresholdPercent}
                    onChange={e => setSettings({ ...settings, criticalThresholdPercent: parseInt(e.target.value, 10) || 95 })}
                    className="liquid-input w-full rounded-xl px-3 py-2 text-rose-400 font-bold text-lg"
                  />
                  <div className="text-[10px] text-slate-400 font-thai">วิกฤต/ต้องเจียร: ค่ามาตรฐาน 95% (แจ้งเตือนแดง+เสียง)</div>
                </div>
              </div>

              {/* Stage Layout Mode Setting */}
              <div className="bg-black/30 p-4 rounded-2xl border border-white/10 space-y-2.5">
                <label className="block text-cyan-300 font-bold text-sm">
                  Default Stage Monitor Display Mode (โหมดการแสดงผลของ Stage บนหน้าจอ)
                </label>
                <p className="text-xs text-slate-400 font-thai">
                  เลือกระดับความหนาแน่นในการแสดงผลแถวข้อมูลแม่พิมพ์บนหน้าจอ TV Dashboard
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    (settings.stageDisplayMode || 'DETAILED') === 'DETAILED'
                      ? 'bg-cyan-950/40 border-cyan-400/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                  }`}>
                    <input
                      type="radio"
                      name="stageDisplayMode"
                      value="DETAILED"
                      checked={(settings.stageDisplayMode || 'DETAILED') === 'DETAILED'}
                      onChange={() => setSettings({ ...settings, stageDisplayMode: 'DETAILED' })}
                      className="mt-0.5 text-cyan-500 focus:ring-cyan-500"
                    />
                    <div>
                      <div className="font-bold text-xs text-white">Detailed Mode (มาตรฐาน)</div>
                      <div className="text-[11px] text-slate-400 font-thai mt-0.5">
                        ตัวเลขขนาดใหญ่พิเศษ เหมาะสำหรับหน้าจอ TV ขนาดใหญ่ 55"+ และมองจากระยะไกล
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    settings.stageDisplayMode === 'COMPACT'
                      ? 'bg-cyan-950/40 border-cyan-400/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20'
                  }`}>
                    <input
                      type="radio"
                      name="stageDisplayMode"
                      value="COMPACT"
                      checked={settings.stageDisplayMode === 'COMPACT'}
                      onChange={() => setSettings({ ...settings, stageDisplayMode: 'COMPACT' })}
                      className="mt-0.5 text-cyan-500 focus:ring-cyan-500"
                    />
                    <div>
                      <div className="font-bold text-xs text-white">Compact Mode (กะทัดรัด)</div>
                      <div className="text-[11px] text-slate-400 font-thai mt-0.5">
                        ปรับลดความสูงแถวและขนาดตัวอักษร พอดีกับหน้าจอแล็ปท็อป/แท็บเล็ต เห็นครบทุก Stage
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="liquid-pill w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-full text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer active:scale-98 border-none"
              >
                บันทึกค่าการตั้งค่าระบบ (SAVE SYSTEM CONFIGURATION)
              </button>
            </form>
      </div>
      )}
    </div>
  );
};

export const LoginView: React.FC<{ onLoginSuccess: (user: User) => void }> = ({ onLoginSuccess }) => {
  const users = storageService.getUsers();
  const defaultUser = users[0] || storageService.getCurrentUser();
  const [selectedUser, setSelectedUser] = useState<User>(defaultUser);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      storageService.setCurrentUser(selectedUser);
      onLoginSuccess(selectedUser);
    }
  };

  const activeUser = selectedUser || defaultUser;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full liquid-glass-card border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 mx-auto flex items-center justify-center font-bold shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Factory System Sign-in
          </h2>
          <p className="text-xs text-slate-400 font-thai">
            เข้าสู่ระบบควบคุมช็อตแม่พิมพ์ Fin Press & Fin Die
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Select Operator / Role (เลือกรหัสพนักงาน)
            </label>
            <div className="space-y-2">
              {users.map(u => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs font-mono active:scale-98 ${
                    activeUser?.id === u.id
                      ? 'bg-cyan-950/60 border-cyan-400/60 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-black/30 border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-100">{u.name}</div>
                    <div className="text-[11px] text-slate-400 font-thai">{u.nameTh}</div>
                    <div className="text-[10px] text-slate-500">{u.department} • ID: {u.employeeId}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white/[0.08] text-cyan-300 border border-white/10 font-bold text-[11px]">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="liquid-pill w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-full text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-98 border-none"
          >
            <UserCheck className="w-4 h-4" />
            <span>ENTER APPLICATION AS {(activeUser?.name || 'USER').toUpperCase()}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
