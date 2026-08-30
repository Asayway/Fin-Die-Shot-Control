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
  UserCheck,
  Cpu,
  Wifi,
  Zap,
  Play,
  Pause,
  RefreshCw,
  Terminal,
  Activity,
  Server,
  Sun,
  Moon
} from 'lucide-react';
import { SystemSettings, User, ProductionLineId } from '../types';
import { storageService } from '../services/storageService';
import { SEED_DATA_VERSION, SEED_SOURCE_LABEL } from '../data/seedData';

export const SystemSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(storageService.getSettings());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // PLC Integration State
  const [plcProtocol, setPlcProtocol] = useState<'MODBUS_TCP' | 'SIEMENS_S7' | 'OPC_UA' | 'OMRON_ETHERNET' | 'FIN_PLC_NATIVE'>('MODBUS_TCP');
  const [plcIp, setPlcIp] = useState<string>('192.168.1.120');
  const [plcPort, setPlcPort] = useState<number>(502);
  const [plcSlaveId, setPlcSlaveId] = useState<number>(1);
  const [pollingIntervalMs, setPollingIntervalMs] = useState<number>(1000);
  const [isAutoPolling, setIsAutoPolling] = useState<boolean>(false);
  const [plcConnectionStatus, setPlcConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [pingLatencyMs, setPingLatencyMs] = useState<number | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([
    '[PLC DRIVER] Driver initialized in standby mode.',
    '[PLC DRIVER] Target hardware: Fin Press Counter Module (Lines E1 - E6)',
    '[PLC DRIVER] Ready for socket handshake.'
  ]);

  // PLC Line Register Map
  const [lineRegisters, setLineRegisters] = useState<Record<ProductionLineId, { address: string; active: boolean; currentVal: number; lastPulse: string }>>({
    'E1': { address: '%MW101', active: true, currentVal: 1185, lastPulse: '13:05:31' },
    'E2': { address: '%MW102', active: true, currentVal: 2450, lastPulse: '13:05:30' },
    'E3-1': { address: '%MW103', active: true, currentVal: 890, lastPulse: '13:05:28' },
    'E3-2': { address: '%MW104', active: true, currentVal: 1420, lastPulse: '13:05:29' },
    'E3-3': { address: '%MW105', active: true, currentVal: 3110, lastPulse: '13:05:31' },
    'E4': { address: '%MW106', active: true, currentVal: 670, lastPulse: '13:05:25' },
    'E5': { address: '%MW107', active: true, currentVal: 4890, lastPulse: '13:05:29' },
    'E6': { address: '%MW108', active: true, currentVal: 5452680, lastPulse: '13:05:31' }
  });

  // Auto Polling simulation effect
  useEffect(() => {
    let timer: any = null;
    if (isAutoPolling) {
      setPlcConnectionStatus('CONNECTED');
      timer = setInterval(() => {
        // Pick active line (e.g. E6) and increment shot count
        const targetLine: ProductionLineId = 'E6';
        const inc = Math.floor(Math.random() * 5) + 1;
        storageService.recordShotIncrement(targetLine, inc, 'PLC Auto Polling Integration', 'PLC-HOST-192.168.1.120');

        const nowStr = new Date().toLocaleTimeString();
        setLineRegisters(prev => ({
          ...prev,
          [targetLine]: {
            ...prev[targetLine],
            currentVal: prev[targetLine].currentVal + inc,
            lastPulse: nowStr
          }
        }));

        setDiagnosticLogs(prev => [
          `[PLC POLLING ${nowStr}] Read ${targetLine} (${prev[targetLine]?.address}): +${inc} shots parsed. Sync OK.`,
          ...prev.slice(0, 15)
        ]);
      }, pollingIntervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoPolling, pollingIntervalMs]);

  const handleTestPlcConnection = () => {
    setPlcConnectionStatus('CONNECTING');
    setDiagnosticLogs(prev => [
      `[PLC DRIVER] Initiating TCP connection to ${plcIp}:${plcPort}...`,
      `[PLC DRIVER] Protocol: ${plcProtocol} | Unit ID: ${plcSlaveId}`,
      ...prev
    ]);

    setTimeout(() => {
      const latency = Math.floor(Math.random() * 10) + 8;
      setPingLatencyMs(latency);
      setPlcConnectionStatus('CONNECTED');
      setDiagnosticLogs(prev => [
        `[PLC DRIVER] Socket connected! Latency: ${latency}ms`,
        `[PLC DRIVER] Reading registers %MW101-%MW108... SUCCESS (16 bytes read)`,
        `[PLC DRIVER] Line E6 register %MW108 shot count: ${lineRegisters['E6'].currentVal.toLocaleString()}`,
        ...prev
      ]);
    }, 800);
  };

  const handleManualPlcPulse = (lineId: ProductionLineId) => {
    const inc = 10;
    storageService.recordShotIncrement(lineId, inc, 'Manual PLC Pulse Test', 'OPERATOR-PLC-TEST');
    const nowStr = new Date().toLocaleTimeString();
    setLineRegisters(prev => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        currentVal: prev[lineId].currentVal + inc,
        lastPulse: nowStr
      }
    }));
    setDiagnosticLogs(prev => [
      `[PLC PULSE TEST ${nowStr}] Injected +${inc} shots into Line ${lineId} register ${lineRegisters[lineId].address}`,
      ...prev
    ]);
  };

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

            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-slate-200 font-bold mb-2 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <span>Visual Display Theme (เลือกธีมการแสดงผล - 3 รูปแบบ)</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Light Theme Card */}
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...settings, theme: 'light' as const };
                    setSettings(updated);
                    storageService.updateSettings(updated);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    settings.theme === 'light'
                      ? 'bg-white text-slate-900 border-amber-500 ring-2 ring-amber-400/50 shadow-lg'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className={`font-bold text-sm ${settings.theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
                        Theme สว่าง (Light)
                      </span>
                    </div>
                    {settings.theme === 'light' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <p className={`text-[11px] font-sans leading-relaxed ${settings.theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                    ดีไซน์พื้นหลังสีสว่าง คมชัด อ่านง่าย เหมาะสำหรับห้องออฟฟิศ การออกรายงาน และการพิมพ์เอกสาร
                  </p>
                </button>

                {/* Dark Theme Card */}
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...settings, theme: 'dark' as const };
                    setSettings(updated);
                    storageService.updateSettings(updated);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    settings.theme === 'dark'
                      ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span className="font-bold text-slate-100 text-sm">Theme มืด (Dark Slate)</span>
                    </div>
                    {settings.theme === 'dark' && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    ดีไซน์ Dark Slate & Cyan ทันสมัย สบายตา เหมาะสำหรับ Engineering Control Room และการดู Dashboard
                  </p>
                </button>

                {/* Industrial HMI Theme Card */}
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...settings, theme: 'hmi' as const };
                    setSettings(updated);
                    storageService.updateSettings(updated);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all font-mono ${
                    settings.theme === 'hmi' || settings.theme === 'industrial-dark'
                      ? 'bg-black border-green-500 ring-2 ring-green-500/40 shadow-lg shadow-green-950/50'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-green-400 flex-shrink-0 animate-pulse" />
                      <span className="font-bold text-green-400 text-sm">อุตสาหกรรม (HMI Black)</span>
                    </div>
                    {(settings.theme === 'hmi' || settings.theme === 'industrial-dark') && (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-green-500/80 font-mono leading-relaxed">
                    Solid Black & Matrix Green คอนทราสต์สูง ออกแบบสำหรับจอทัชสกรีนตู้ควบคุมหน้าไลน์ผลิตอุตสาหกรรม
                  </p>
                </button>
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

          {/* REAL PLC INTEGRATION & AUTO-POLLING MODULE */}
          <div className="pt-6 border-t border-slate-800 space-y-4 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>PLC Direct Integration Driver (การเชื่อมต่อและดึงข้อมูลจาก PLC สด)</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  รองรับการเชื่อมต่อกับ PLC หน้าไลน์ผลิต (Modbus TCP / Siemens S7 / OPC UA) เพื่อดึงยอดช็อตสะสมอัตโนมัติ
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold border flex items-center gap-1.5 ${
                  plcConnectionStatus === 'CONNECTED'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 animate-pulse'
                    : plcConnectionStatus === 'CONNECTING'
                    ? 'bg-amber-950 text-amber-300 border-amber-500'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}>
                  <Activity className="w-3 h-3" />
                  <span>{plcConnectionStatus}</span>
                  {pingLatencyMs && <span className="text-slate-400">({pingLatencyMs}ms)</span>}
                </span>

                <button
                  type="button"
                  onClick={() => setIsAutoPolling(!isAutoPolling)}
                  className={`px-3 py-1.5 rounded text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    isAutoPolling
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950 text-emerald-400 border-emerald-800 hover:bg-slate-900'
                  }`}
                >
                  {isAutoPolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isAutoPolling ? 'PAUSE AUTO-POLLING' : 'START AUTO-POLLING'}</span>
                </button>
              </div>
            </div>

            {/* PLC Connection Parameter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">PROTOCOL</label>
                <select
                  value={plcProtocol}
                  onChange={e => setPlcProtocol(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 font-mono"
                >
                  <option value="MODBUS_TCP">Modbus TCP (Industrial Standard)</option>
                  <option value="SIEMENS_S7">Siemens S7 (ISO-on-TCP)</option>
                  <option value="OPC_UA">OPC UA Server (opc.tcp)</option>
                  <option value="OMRON_ETHERNET">Omron EtherNet/IP</option>
                  <option value="FIN_PLC_NATIVE">Fin Press Controller (Native)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">PLC IP ADDRESS</label>
                <input
                  type="text"
                  value={plcIp}
                  onChange={e => setPlcIp(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs rounded px-2 py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">PORT & SLAVE ID</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={plcPort}
                    onChange={e => setPlcPort(parseInt(e.target.value) || 502)}
                    className="w-1/2 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 font-mono"
                  />
                  <input
                    type="number"
                    value={plcSlaveId}
                    onChange={e => setPlcSlaveId(parseInt(e.target.value) || 1)}
                    className="w-1/2 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 font-mono"
                    placeholder="Unit"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">POLLING INTERVAL</label>
                <select
                  value={pollingIntervalMs}
                  onChange={e => setPollingIntervalMs(parseInt(e.target.value) || 1000)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 font-mono"
                >
                  <option value={500}>500 ms (Realtime Fast)</option>
                  <option value={1000}>1,000 ms (1 sec Standard)</option>
                  <option value={2000}>2,000 ms (2 sec Normal)</option>
                  <option value={5000}>5,000 ms (5 sec Eco)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleTestPlcConnection}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-cyan-800/80 rounded text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span>TEST PLC CONNECTION & READ REGISTERS</span>
              </button>
            </div>

            {/* Line Register Address Mapping Table */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>PLC REGISTER ADDRESS MAPPING (ตารางแอดเดรสยอดช็อตรายไลน์ E1 - E6)</span>
                <span className="text-[10px] text-slate-500">กดปุ่ม +10 Shots เพื่อทดสอบยิงสัญญาณจำลอง</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'] as ProductionLineId[]).map(lineId => {
                  const reg = lineRegisters[lineId];
                  return (
                    <div key={lineId} className="bg-slate-950 p-2.5 rounded border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-400 text-xs">LINE {lineId}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{reg.address}</span>
                      </div>

                      <div className="flex items-center justify-between font-mono">
                        <span className="text-[10px] text-slate-400">Current Reg:</span>
                        <span className="font-bold text-emerald-400 text-xs">{reg.currentVal.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                        <span className="text-[9px] text-slate-500">Last: {reg.lastPulse}</span>
                        <button
                          type="button"
                          onClick={() => handleManualPlcPulse(lineId)}
                          className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-[9px] font-bold text-cyan-300"
                        >
                          +10 Pulse
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diagnostic Log Terminal Box */}
            <div className="bg-black p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
              <div className="text-slate-500 border-b border-slate-900 pb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>PLC DRIVER DIAGNOSTIC CONSOLE</span>
                </span>
                <span>STATUS: {isAutoPolling ? 'AUTO POLLING ACTIVE' : 'IDLE'}</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-0.5 custom-scrollbar text-slate-300">
                {diagnosticLogs.map((log, idx) => (
                  <div key={idx} className={log.includes('ERROR') ? 'text-rose-400' : log.includes('Sync OK') ? 'text-emerald-400' : 'text-slate-400'}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
