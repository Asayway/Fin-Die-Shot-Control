import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  CheckCircle2, 
  Cpu, 
  Wifi, 
  Play, 
  Pause, 
  Terminal, 
  Activity, 
  Database,
  Lock,
  UserCheck,
  Sun,
  Moon,
  Plus,
  Trash2,
  Copy,
  Layers,
  Network,
  Zap,
  Server
} from 'lucide-react';
import { SystemSettings, User, PLCConnectionMode, PLCProtocol, PLCLineRegisterMap } from '../types';
import { storageService } from '../services/storageService';
import { SEED_DATA_VERSION, SEED_SOURCE_LABEL } from '../data/seedData';
import { usePLCConnection } from '../hooks/usePLCConnection';

export const SystemSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(storageService.getSettings());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Hook for PLC Driver Connection & Real-time Management
  const {
    config: plcConfig,
    status: plcStatus,
    pingLatency,
    logs: diagnosticLogs,
    updateConfig: updatePlcConfig,
    toggleAutoPolling,
    handleTestConnection,
    handleManualPulse,
    updateLineRegisterAddress,
    toggleLineRegisterActive,
    addLineRegisterMapping,
    deleteLineRegisterMapping,
    clearLogs
  } = usePLCConnection();

  // New Line Mapping Modal / Inline Form State
  const [showAddLineForm, setShowAddLineForm] = useState(false);
  const [newLineId, setNewLineId] = useState('');
  const [newLineName, setNewLineName] = useState('');
  const [newLineAddress, setNewLineAddress] = useState('');

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

  const handleCreateLineRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLineId.trim()) return;
    addLineRegisterMapping(newLineId, newLineName, newLineAddress);
    setNewLineId('');
    setNewLineName('');
    setNewLineAddress('');
    setShowAddLineForm(false);
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(diagnosticLogs.join('\n'));
    setSuccessMsg('Diagnostic console logs copied to clipboard!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
            System Settings & Thresholds
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            ตั้งค่าเกณฑ์แจ้งเตือน (Alert Thresholds) ธีม และกู้คืนข้อมูลระบบ
          </p>
        </div>

        <button
          onClick={handleResetSeed}
          className="flex items-center gap-2 px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700 font-bold rounded text-xs transition-all shadow font-mono cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>RESET TO SEED DATA</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-300 rounded text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Settings Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
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
                      ดีไซน์พื้นหลังสีสว่าง คมชัด อ่านง่าย เหมาะสำหรับห้องออฟฟิศ
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
                      ดีไซน์ Dark Slate & Cyan ทันสมัย สบายตา สำหรับ Control Room
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
                      Solid Black & Matrix Green คอนทราสต์สูง สำหรับหน้าไลน์ผลิต
                    </p>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-xs transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                SAVE SYSTEM CONFIGURATION
              </button>
            </form>
          </div>

          {/* ============================================================== */}
          {/* PLC DIRECT INTEGRATION DRIVER SECTION                          */}
          {/* ============================================================== */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5 font-mono">
            {/* Header & Status Indicator Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>PLC Direct Integration Driver (การเชื่อมต่อและดึงข้อมูลจาก PLC สด)</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  รองรับการเชื่อมต่อกับ PLC หน้าไลน์ผลิต (Modbus TCP / Siemens S7 / OPC UA / MQTT Gateway) เพื่อดึงยอดช็อตสะสมอัตโนมัติ
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold border flex items-center gap-1.5 ${
                  plcStatus === 'CONNECTED'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 animate-pulse'
                    : plcStatus === 'CONNECTING' || plcStatus === 'RECONNECTING'
                    ? 'bg-amber-950 text-amber-300 border-amber-500'
                    : plcStatus === 'ERROR'
                    ? 'bg-rose-950 text-rose-300 border-rose-600'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}>
                  <Activity className="w-3 h-3" />
                  <span>{plcStatus}</span>
                  {pingLatency && <span className="text-slate-400">({pingLatency}ms)</span>}
                </span>

                <button
                  type="button"
                  onClick={toggleAutoPolling}
                  className={`px-3 py-1.5 rounded text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    plcConfig.isAutoPolling
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-950 text-emerald-400 border-emerald-800 hover:bg-slate-900'
                  }`}
                >
                  {plcConfig.isAutoPolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{plcConfig.isAutoPolling ? 'PAUSE AUTO-POLLING' : 'START AUTO-POLLING'}</span>
                </button>
              </div>
            </div>

            {/* 1. Connection Mode & Driver Configuration Grid */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. DRIVER CONNECTION MODE & PARAMETERS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                {/* Connection Mode */}
                <div>
                  <label className="block text-[10px] text-cyan-400 font-bold mb-1">CONNECTION MODE</label>
                  <select
                    value={plcConfig.connectionMode}
                    onChange={e => updatePlcConfig({ connectionMode: e.target.value as PLCConnectionMode })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="SIMULATION">SIMULATION (+10 Pulse / Dummy)</option>
                    <option value="WEBSOCKET_MQTT">WEBSOCKET / MQTT EDGE GATEWAY</option>
                    <option value="REST_POLLING">REST API POLLING SERVICE</option>
                    <option value="MODBUS_TCP">LOCAL BRIDGE / MODBUS TCP</option>
                  </select>
                </div>

                {/* Protocol Selector */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">PROTOCOL</label>
                  <select
                    value={plcConfig.protocol}
                    onChange={e => updatePlcConfig({ protocol: e.target.value as PLCProtocol })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="MODBUS_TCP">Modbus TCP (Industrial Standard)</option>
                    <option value="SIEMENS_S7">Siemens S7 (ISO-on-TCP)</option>
                    <option value="OPC_UA">OPC UA Server (opc.tcp)</option>
                    <option value="OMRON_ETHERNET">Omron EtherNet/IP</option>
                    <option value="FIN_PLC_NATIVE">Fin Press Controller (Native)</option>
                    <option value="WEBSOCKET_MQTT">MQTT / Node-RED WebSocket</option>
                    <option value="REST_API">HTTP REST API Gateway</option>
                  </select>
                </div>

                {/* PLC IP Address */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">PLC IP ADDRESS</label>
                  <input
                    type="text"
                    value={plcConfig.ip}
                    onChange={e => updatePlcConfig({ ip: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs rounded px-2 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
                    placeholder="192.168.1.120"
                  />
                </div>

                {/* Port & Slave ID */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">PORT & SLAVE ID</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={plcConfig.port}
                      onChange={e => updatePlcConfig({ port: parseInt(e.target.value, 10) || 502 })}
                      className="w-1/2 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
                      title="Port (e.g. 502, 1880, 8080)"
                    />
                    <input
                      type="number"
                      value={plcConfig.slaveId}
                      onChange={e => updatePlcConfig({ slaveId: parseInt(e.target.value, 10) || 1 })}
                      className="w-1/2 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
                      placeholder="Unit ID"
                      title="Slave Unit ID"
                    />
                  </div>
                </div>

                {/* Polling Interval */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">POLLING INTERVAL</label>
                  <select
                    value={plcConfig.pollingIntervalMs}
                    onChange={e => updatePlcConfig({ pollingIntervalMs: parseInt(e.target.value, 10) || 1000 })}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value={500}>500 ms (Realtime Fast)</option>
                    <option value={1000}>1,000 ms (1 sec Standard)</option>
                    <option value={2000}>2,000 ms (2 sec Normal)</option>
                    <option value={5000}>5,000 ms (5 sec Eco)</option>
                  </select>
                </div>

                {/* UI Performance Throttle Speed (Batching) */}
                <div>
                  <label className="block text-[10px] text-amber-400 font-bold mb-1">UI UPDATE THROTTLE SPEED</label>
                  <select
                    value={plcConfig.uiThrottleMs}
                    onChange={e => updatePlcConfig({ uiThrottleMs: parseInt(e.target.value, 10) || 1000 })}
                    className="w-full bg-slate-900 border border-amber-800/80 text-amber-300 font-bold text-xs rounded px-2 py-1.5 font-mono focus:border-amber-400 focus:outline-none"
                  >
                    <option value={500}>500 ms (Fast UI Refresh)</option>
                    <option value={1000}>1,000 ms (Standard Throttled - Recommended)</option>
                    <option value={2000}>2,000 ms (Low CPU Batch)</option>
                  </select>
                </div>

                {/* Dynamic Endpoint URL based on Mode */}
                {plcConfig.connectionMode === 'WEBSOCKET_MQTT' && (
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[10px] text-cyan-400 font-bold mb-1">WEBSOCKET EDGE GATEWAY URL</label>
                    <input
                      type="text"
                      value={plcConfig.wsUrl}
                      onChange={e => updatePlcConfig({ wsUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-cyan-800 text-cyan-300 text-xs rounded px-2 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
                      placeholder="ws://192.168.1.120:1880/ws/plc"
                    />
                  </div>
                )}

                {plcConfig.connectionMode === 'REST_POLLING' && (
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[10px] text-cyan-400 font-bold mb-1">REST API ENDPOINT URL</label>
                    <input
                      type="text"
                      value={plcConfig.restApiUrl}
                      onChange={e => updatePlcConfig({ restApiUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-cyan-800 text-cyan-300 text-xs rounded px-2 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
                      placeholder="http://192.168.1.120:8080/api/v1/plc/shots"
                    />
                  </div>
                )}
              </div>

              {/* Throttle protection notice */}
              <div className="text-[10px] text-slate-500 font-sans flex items-center justify-between">
                <span>⚡ High-Speed UI Protection: Batch-flushes pulse counts every {plcConfig.uiThrottleMs}ms to prevent React re-render lag.</span>
                <span className="text-slate-400 font-mono">Persisted in localStorage</span>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-cyan-800/80 rounded text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span>TEST PLC CONNECTION & READ REGISTERS</span>
              </button>
            </div>

            {/* 2. Line Register Address Mapping Grid */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800 pt-3">
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2. PLC REGISTER ADDRESS MAPPING (ตารางแอดเดรสยอดช็อตรายไลน์)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                    กำหนดค่า Register Address (%MW, DB, Topic) สำหรับอ่านยอดช็อตแต่ละสาย | กดปุ่ม +10 Pulse เพื่อทดสอบยิงสัญญาณ
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddLineForm(!showAddLineForm)}
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-cyan-800/80 rounded text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD LINE MAPPING</span>
                </button>
              </div>

              {/* Inline Add Line Form */}
              {showAddLineForm && (
                <form onSubmit={handleCreateLineRegister} className="bg-slate-950 p-3 rounded-lg border border-cyan-800/80 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">LINE ID (e.g. E7)</label>
                    <input
                      type="text"
                      required
                      value={newLineId}
                      onChange={e => setNewLineId(e.target.value)}
                      placeholder="E7"
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-2 py-1.5 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">LINE NAME</label>
                    <input
                      type="text"
                      value={newLineName}
                      onChange={e => setNewLineName(e.target.value)}
                      placeholder="LINE E7 (Ø7 Louver)"
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-2 py-1.5 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">REGISTER ADDRESS</label>
                    <input
                      type="text"
                      required
                      value={newLineAddress}
                      onChange={e => setNewLineAddress(e.target.value)}
                      placeholder="%MW109 or DB1.DBD20"
                      className="w-full bg-slate-900 border border-slate-700 text-cyan-300 px-2 py-1.5 rounded font-mono"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-xs"
                    >
                      CONFIRM ADD
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddLineForm(false)}
                      className="px-2 py-1.5 bg-slate-800 text-slate-300 rounded text-xs font-bold"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              )}

              {/* Grid of Mapped Line Registers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.values(plcConfig.lineRegisters) as PLCLineRegisterMap[]).map((reg: PLCLineRegisterMap) => (
                  <div key={reg.lineId} className={`bg-slate-950 p-2.5 rounded border transition-all space-y-1.5 ${
                    reg.active ? 'border-slate-800/80 hover:border-slate-700' : 'border-slate-900 opacity-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={reg.active}
                          onChange={() => toggleLineRegisterActive(reg.lineId)}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                          title="Toggle active line polling"
                        />
                        <span className="font-bold text-cyan-400 text-xs">LINE {reg.lineId}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteLineRegisterMapping(reg.lineId)}
                        className="text-slate-600 hover:text-rose-400 p-0.5 rounded cursor-pointer transition-colors"
                        title="Delete line mapping"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Editable Register Address Input */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] text-slate-500 uppercase">Reg:</span>
                      <input
                        type="text"
                        value={reg.address}
                        onChange={e => updateLineRegisterAddress(reg.lineId, e.target.value)}
                        className="w-24 bg-slate-900 border border-slate-800 focus:border-cyan-500 text-right text-[10px] text-slate-300 font-mono px-1 py-0.5 rounded focus:outline-none"
                      />
                    </div>

                    {/* Current Value Display */}
                    <div className="flex items-center justify-between font-mono pt-0.5">
                      <span className="text-[10px] text-slate-400">Current:</span>
                      <span className="font-bold text-emerald-400 text-xs">{(reg.currentVal || 0).toLocaleString()}</span>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                      <span className="text-[9px] text-slate-500 truncate max-w-[80px]">
                        {reg.lastPulse ? `Last: ${reg.lastPulse}` : 'No pulse'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleManualPulse(reg.lineId, 10)}
                        className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-[9px] font-bold text-cyan-300 cursor-pointer transition-colors"
                      >
                        +10 Pulse
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Diagnostic Console */}
            <div className="bg-black p-3.5 rounded-lg border border-slate-800 font-mono text-[11px] space-y-2">
              <div className="text-slate-500 border-b border-slate-900 pb-1.5 flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PLC DRIVER DIAGNOSTIC CONSOLE</span>
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    STATUS: <span className="text-cyan-400 font-bold">{plcConfig.isAutoPolling ? 'AUTO POLLING ACTIVE' : 'IDLE'}</span> ({plcConfig.protocol})
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyLogs}
                    className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-[9px] font-bold border border-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-2.5 h-2.5" />
                    <span>COPY</span>
                  </button>

                  <button
                    type="button"
                    onClick={clearLogs}
                    className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded text-[9px] font-bold border border-slate-800 cursor-pointer"
                  >
                    CLEAR
                  </button>
                </div>
              </div>

              {/* Console Output Body */}
              <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar text-slate-300 font-mono">
                {diagnosticLogs.map((log, idx) => {
                  let textClass = 'text-slate-400';
                  if (log.includes('ERROR') || log.includes('Failed')) textClass = 'text-rose-400 font-bold';
                  else if (log.includes('SUCCESS') || log.includes('FLUSH') || log.includes('CONNECTED')) textClass = 'text-emerald-400';
                  else if (log.includes('Initiating') || log.includes('PULSE TEST')) textClass = 'text-cyan-300';

                  return (
                    <div key={idx} className={`${textClass} leading-tight`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Column */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 font-mono text-xs text-slate-300 h-fit">
          <h3 className="font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Seed Data Lineage & Driver Status</span>
          </h3>

          <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-3">
            <div>
              <div className="text-slate-500 text-[10px]">DATA SOURCE</div>
              <div className="font-bold text-emerald-400 text-xs">{SEED_SOURCE_LABEL}</div>
            </div>

            <div>
              <div className="text-slate-500 text-[10px]">VERSION RELEASE</div>
              <div className="text-slate-200">{SEED_DATA_VERSION}</div>
            </div>

            <div>
              <div className="text-slate-500 text-[10px]">ACTIVE PLC CONNECTION</div>
              <div className="text-cyan-300 font-bold flex items-center gap-1.5 mt-0.5">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span>{plcConfig.protocol} @ {plcConfig.ip}:{plcConfig.port}</span>
              </div>
            </div>

            <div>
              <div className="text-slate-500 text-[10px]">REGISTER MAPPINGS</div>
              <div className="text-slate-200">
                {Object.keys(plcConfig.lineRegisters).length} Monitored Lines ({(Object.values(plcConfig.lineRegisters) as PLCLineRegisterMap[]).filter((r: PLCLineRegisterMap) => r.active).length} Active)
              </div>
            </div>

            <div>
              <div className="text-slate-500 text-[10px]">THROTTLE BATCH SPEED</div>
              <div className="text-amber-300 font-bold">
                {plcConfig.uiThrottleMs}ms UI Protection Batch
              </div>
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
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>ENTER APPLICATION AS {selectedUser.name.toUpperCase()}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
