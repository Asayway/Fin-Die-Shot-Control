import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  Globe, 
  Database,
  Lock,
  UserCheck
} from 'lucide-react';
import { SystemSettings, User } from '../types';
import { storageService } from '../services/storageService';
import { SEED_DATA_VERSION, SEED_SOURCE_LABEL } from '../data/seedData';

export const SystemSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(storageService.getSettings());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSettings(settings);
    setSuccessMsg('System configuration and threshold parameters saved successfully!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleResetSeed = () => {
    if (window.confirm('Are you sure you want to reset all data back to the original Excel seed data (31.01.2025)? All recent shot edits and logs will be restored to factory default.')) {
      storageService.resetToSeedData();
      setSettings(storageService.getSettings());
      setSuccessMsg('Application state successfully reset to original 31.01.2025 Excel dataset!');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
            Fin Press System Settings & Life Thresholds
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            ตั้งค่าเกณฑ์เปอร์เซ็นต์แจ้งเตือน (Alert Thresholds), กะการทำงาน และการกู้คืนข้อมูล Seed Data
          </p>
        </div>

        <button
          onClick={handleResetSeed}
          className="flex items-center gap-2 px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700 font-bold rounded text-xs transition-all shadow font-mono"
        >
          <RotateCcw className="w-4 h-4" />
          <span>RESET TO EXCEL SEED DATA</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-300 rounded text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold text-slate-100 border-b border-slate-800 pb-3">
            Life Percentage Thresholds (เกณฑ์ขีดจำกัดการแจ้งเตือนช็อต)
          </h3>

          <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-3 rounded border border-yellow-800/60">
                <label className="block text-yellow-300 font-bold mb-1">
                  WARNING Threshold (%)
                </label>
                <input
                  type="number"
                  value={settings.warningThresholdPercent}
                  onChange={e => setSettings({ ...settings, warningThresholdPercent: parseInt(e.target.value, 10) || 70 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-yellow-300 font-bold text-base"
                />
                <div className="text-[10px] text-slate-500 mt-1">Default: 70% (Yellow highlight)</div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-amber-800/60">
                <label className="block text-amber-400 font-bold mb-1">
                  PREPARE Threshold (%)
                </label>
                <input
                  type="number"
                  value={settings.prepareThresholdPercent}
                  onChange={e => setSettings({ ...settings, prepareThresholdPercent: parseInt(e.target.value, 10) || 85 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-amber-400 font-bold text-base"
                />
                <div className="text-[10px] text-slate-500 mt-1">Default: 85% (Orange highlight)</div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-rose-800/60">
                <label className="block text-rose-400 font-bold mb-1">
                  CRITICAL Threshold (%)
                </label>
                <input
                  type="number"
                  value={settings.criticalThresholdPercent}
                  onChange={e => setSettings({ ...settings, criticalThresholdPercent: parseInt(e.target.value, 10) || 95 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-rose-400 font-bold text-base"
                />
                <div className="text-[10px] text-slate-500 mt-1">Default: 95% (Red alert & sound)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Display Language Mode</label>
                <select
                  value={settings.language}
                  onChange={e => setSettings({ ...settings, language: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100"
                >
                  <option value="EN">English Only (EN)</option>
                  <option value="TH">Thai Only (TH)</option>
                  <option value="DUAL">Dual Language (EN + Thai Help)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Sound & Audible Alarms</label>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, enableSoundAlerts: !settings.enableSoundAlerts })}
                  className={`w-full py-2 px-3 rounded font-bold border transition-colors ${
                    settings.enableSoundAlerts ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  {settings.enableSoundAlerts ? 'ENABLED (เปิดเสียงเตือน)' : 'MUTED (ปิดเสียง)'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-xs transition-all shadow-lg shadow-cyan-500/20"
            >
              SAVE SYSTEM CONFIGURATION
            </button>
          </form>
        </div>

        {/* Right Info */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 font-mono text-xs text-slate-300">
          <h3 className="font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Seed Data Lineage</span>
          </h3>

          <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
            <div>
              <div className="text-slate-500 text-[10px]">DATA SOURCE</div>
              <div className="font-bold text-emerald-400 text-xs">{SEED_SOURCE_LABEL}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">VERSION RELEASE</div>
              <div className="text-slate-200">{SEED_DATA_VERSION}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">TOTAL MONITORED LINES</div>
              <div className="text-cyan-300">8 Lines (E1, E2, E3-1, E3-2, E3-3, E4, E5, E6)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoginView: React.FC<{ onLoginSuccess: (user: User) => void }> = ({ onLoginSuccess }) => {
  const users = storageService.getUsers();
  const [selectedUser, setSelectedUser] = useState<User>(users[0]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.setCurrentUser(selectedUser);
    onLoginSuccess(selectedUser);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center font-bold">
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
                  className={`p-3 rounded border cursor-pointer transition-all flex items-center justify-between text-xs font-mono ${
                    selectedUser.id === u.id
                      ? 'bg-cyan-950/70 border-cyan-500 text-cyan-100'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-100">{u.name}</div>
                    <div className="text-[11px] text-slate-400 font-thai">{u.nameTh}</div>
                    <div className="text-[10px] text-slate-500">{u.department} • ID: {u.employeeId}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 font-bold">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>ENTER APPLICATION AS {selectedUser.name.toUpperCase()}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
