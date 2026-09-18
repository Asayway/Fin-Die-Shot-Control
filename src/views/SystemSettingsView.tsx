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
    if (settings.stageDisplayMode) {
      localStorage.setItem('findie_tv_layout_mode', settings.stageDisplayMode);
    }
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
      <div className="liquid-glass-card border border-white/10 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
            System Settings & Thresholds
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            ตั้งค่าเกณฑ์แจ้งเตือน (Alert Thresholds) และกู้คืนข้อมูลระบบ
          </p>
        </div>

        <button
          onClick={handleResetSeed}
          className="liquid-pill flex items-center gap-2 px-5 py-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 font-bold rounded-full text-xs transition-all shadow font-mono cursor-pointer active:scale-95"
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Settings Form */}
          <div className="liquid-glass-card border border-white/10 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
            <h3 className="font-bold text-slate-100 border-b border-white/10 pb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
              Life Percentage Thresholds (เกณฑ์ขีดจำกัดการแจ้งเตือนช็อต)
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-black/30 p-3.5 rounded-2xl border border-yellow-500/30">
                  <label className="block text-yellow-300 font-bold mb-1.5">
                    WARNING Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={settings.warningThresholdPercent}
                    onChange={e => setSettings({ ...settings, warningThresholdPercent: parseInt(e.target.value, 10) || 70 })}
                    className="liquid-input w-full rounded-xl px-3 py-2 text-yellow-300 font-bold text-base"
                  />
                  <div className="text-[10px] text-slate-400 mt-1.5">Default: 70% (Yellow highlight)</div>
                </div>

                <div className="bg-black/30 p-3.5 rounded-2xl border border-amber-500/30">
                  <label className="block text-amber-400 font-bold mb-1.5">
                    PREPARE Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={settings.prepareThresholdPercent}
                    onChange={e => setSettings({ ...settings, prepareThresholdPercent: parseInt(e.target.value, 10) || 85 })}
                    className="liquid-input w-full rounded-xl px-3 py-2 text-amber-400 font-bold text-base"
                  />
                  <div className="text-[10px] text-slate-400 mt-1.5">Default: 85% (Orange highlight)</div>
                </div>

                <div className="bg-black/30 p-3.5 rounded-2xl border border-rose-500/30">
                  <label className="block text-rose-400 font-bold mb-1.5">
                    CRITICAL Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={settings.criticalThresholdPercent}
                    onChange={e => setSettings({ ...settings, criticalThresholdPercent: parseInt(e.target.value, 10) || 95 })}
                    className="liquid-input w-full rounded-xl px-3 py-2 text-rose-400 font-bold text-base"
                  />
                  <div className="text-[10px] text-slate-400 mt-1.5">Default: 95% (Red alert & sound)</div>
                </div>
              </div>

              {/* Stage Layout Mode Setting */}
              <div className="bg-black/30 p-4 rounded-2xl border border-white/10 space-y-2">
                <label className="block text-cyan-300 font-bold text-sm">
                  Default Stage Monitor Display Mode (โหมดการแสดงผลของ Stage บนหน้าจอ)
                </label>
                <p className="text-[11px] text-slate-400 font-sans">
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
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">
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
                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                        ปรับลดความสูงแถวและขนาดตัวอักษร พอดีกับหน้าจอแล็ปท็อป/แท็บเล็ต ช่วยให้เห็นครบทุก Stage โดยไม่ต้องเลื่อน
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="liquid-pill w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-full text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer active:scale-98 border-none"
              >
                SAVE SYSTEM CONFIGURATION
              </button>
            </form>
          </div>

          {/* ============================================================== */}
          {/* PLC DIRECT INTEGRATION DRIVER SECTION                          */}
          {/* ============================================================== */}
          <div className="liquid-glass-card border border-white/10 rounded-3xl p-5 sm:p-6 space-y-5 font-mono shadow-xl">
            {/* Header & Status Indicator Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>PLC Direct Integration Driver (การเชื่อมต่อและดึงข้อมูลจาก PLC สด)</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  รองรับการเชื่อมต่อกับ PLC หน้าไลน์ผลิต (Modbus TCP / Siemens S7 / OPC UA / MQTT Gateway) เพื่อดึงยอดช็อตสะสมอัตโนมัติ
                </p>
                <div className="mt-2 flex items-center gap-2 px-3.5 py-1.5 bg-amber-950/40 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-sans">
                  <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span><strong>SAFETY NOTICE:</strong> Telemetry mode is currently READ-ONLY. Connection to production PLC (192.168.10.50) is restricted for verification phase.</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                  plcStatus === 'GATEWAY_ONLINE' || plcStatus === 'CONNECTED'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 animate-pulse'
                    : plcStatus === 'GATEWAY_CONNECTING' || plcStatus === 'CONNECTING' || plcStatus === 'RECONNECTING'
                    ? 'bg-amber-950 text-amber-300 border-amber-500'
                    : plcStatus === 'TEST_SIMULATION_ACTIVE'
                    ? 'bg-purple-950 text-purple-300 border-purple-500 animate-pulse'
                    : plcStatus === 'WAITING_FOR_GATEWAY'
                    ? 'bg-blue-950 text-blue-300 border-blue-500 animate-pulse'
                    : plcStatus === 'GATEWAY_OFFLINE' || plcStatus === 'ERROR'
                    ? 'bg-rose-950 text-rose-300 border-rose-600'
                    : 'bg-black/40 text-slate-400 border-white/10'
                }`}>
                  <Activity className="w-3 h-3" />
                  <span>{plcStatus.replace(/_/g, ' ')}</span>
                  {pingLatency && <span className="text-slate-400">({pingLatency}ms)</span>}
                </span>

                <button
                  type="button"
                  onClick={toggleAutoPolling}
                  className={`liquid-pill px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                    plcConfig.isAutoPolling
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-black'
                      : 'bg-black/30 text-emerald-400 border-emerald-800/60 hover:bg-white/[0.06]'
                  }`}
                >
                  {plcConfig.isAutoPolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>
                    {plcConfig.connectionMode === 'SIMULATION' 
                      ? (plcConfig.isAutoPolling ? 'STOP TEST SIMULATION' : 'START TEST SIMULATION')
                      : (plcConfig.isAutoPolling ? 'PAUSE AUTO-POLLING' : 'START AUTO-POLLING')}
                  </span>
                </button>
              </div>
            </div>

            {/* 1. Connection Mode & Driver Configuration Grid */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. DRIVER CONNECTION MODE & PARAMETERS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-black/30 p-4 rounded-2xl border border-white/10">
                {/* Connection Mode */}
                <div>
                  <label className="block text-[10px] text-cyan-400 font-bold mb-1">CONNECTION MODE</label>
                  <select
                    value={plcConfig.connectionMode}
                    onChange={e => updatePlcConfig({ connectionMode: e.target.value as PLCConnectionMode })}
                    className="liquid-input w-full text-slate-200 text-xs rounded-xl px-2.5 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="SIMULATION">SIMULATION (Virtual Pulse Generator - Not Real)</option>
                    <option value="MODBUS_TCP">REAL PLC: Direct Industrial Modbus TCP (Ethernet)</option>
                    <option value="WEBSOCKET_MQTT">EDGE GATEWAY: MQTT / WebSocket Broker</option>
                    <option value="REST_POLLING">BACKEND API: REST Polling Service</option>
                  </select>
                </div>

                {/* Protocol Selector */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">PROTOCOL</label>
                  <select
                    value={plcConfig.protocol}
                    onChange={e => updatePlcConfig({ protocol: e.target.value as PLCProtocol })}
                    className="liquid-input w-full text-slate-200 text-xs rounded-xl px-2.5 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
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
                    className="liquid-input w-full text-emerald-400 font-bold text-xs rounded-xl px-2.5 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
                    placeholder="192.168.1.120"
                  />
                </div>

                {/* Port & Slave ID */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">PORT & SLAVE ID</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={plcConfig.port}
                      onChange={e => updatePlcConfig({ port: parseInt(e.target.value, 10) || 502 })}
                      className="liquid-input w-1/2 text-slate-200 text-xs rounded-xl px-2 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
                      title="Port (e.g. 502, 1880, 8080)"
                    />
                    <input
                      type="number"
                      value={plcConfig.slaveId}
                      onChange={e => updatePlcConfig({ slaveId: parseInt(e.target.value, 10) || 1 })}
                      className="liquid-input w-1/2 text-slate-200 text-xs rounded-xl px-2 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
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
                    className="liquid-input w-full text-slate-200 text-xs rounded-xl px-2.5 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
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
                    className="liquid-input w-full text-amber-300 font-bold text-xs rounded-xl px-2.5 py-1.5 font-mono focus:border-amber-400 focus:outline-none"
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
                      className="liquid-input w-full text-cyan-300 text-xs rounded-xl px-2.5 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
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
                      className="liquid-input w-full text-cyan-300 text-xs rounded-xl px-2.5 py-1.5 font-mono focus:border-cyan-400 focus:outline-none"
                      placeholder="http://192.168.1.120:8080/api/v1/plc/shots"
                    />
                  </div>
                )}
              </div>

              {/* Throttle protection notice */}
              <div className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
                <span>⚡ High-Speed UI Protection: Batch-flushes pulse counts every {plcConfig.uiThrottleMs}ms to prevent React re-render lag.</span>
                <span className="text-slate-400 font-mono">Persisted in localStorage</span>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                className="liquid-pill px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.12] text-cyan-300 font-bold border border-cyan-500/40 rounded-full text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
              >
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span>TEST PLC CONNECTION & READ REGISTERS</span>
              </button>
            </div>

            {/* 2. Line Register Address Mapping Grid */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/10 pt-4">
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2. PLC REGISTER ADDRESS MAPPING (ตารางแอดเดรสยอดช็อตรายไลน์)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                    กำหนดค่า Register Address (%MW, DB, Topic) สำหรับอ่านยอดช็อตแต่ละสาย | กดปุ่ม +10 Pulse เพื่อทดสอบยิงสัญญาณ
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddLineForm(!showAddLineForm)}
                  className="liquid-pill px-3.5 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD LINE MAPPING</span>
                </button>
              </div>

              {/* Inline Add Line Form */}
              {showAddLineForm && (
                <form onSubmit={handleCreateLineRegister} className="bg-black/40 p-4 rounded-2xl border border-cyan-500/40 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs shadow-lg">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">LINE ID (e.g. E7)</label>
                    <input
                      type="text"
                      required
                      value={newLineId}
                      onChange={e => setNewLineId(e.target.value)}
                      placeholder="E7"
                      className="liquid-input w-full rounded-xl px-2.5 py-1.5 font-mono text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">LINE NAME</label>
                    <input
                      type="text"
                      value={newLineName}
                      onChange={e => setNewLineName(e.target.value)}
                      placeholder="LINE E7 (Ø7 Louver)"
                      className="liquid-input w-full rounded-xl px-2.5 py-1.5 font-mono text-slate-100"
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
                      className="liquid-input w-full rounded-xl px-2.5 py-1.5 font-mono text-cyan-300"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      className="liquid-pill w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-full text-xs shadow-md active:scale-95 border-none"
                    >
                      CONFIRM ADD
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddLineForm(false)}
                      className="liquid-pill px-3 py-2 bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 rounded-full text-xs font-bold border border-white/10 active:scale-95 cursor-pointer"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              )}

              {/* Grid of Mapped Line Registers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(Object.values(plcConfig.lineRegisters) as PLCLineRegisterMap[]).map((reg: PLCLineRegisterMap) => (
                  <div key={reg.lineId} className={`bg-black/30 p-3 rounded-2xl border transition-all space-y-2 ${
                    reg.active ? 'border-white/10 hover:border-cyan-500/40 shadow-sm' : 'border-white/5 opacity-50'
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
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-full hover:bg-rose-500/10 cursor-pointer transition-colors"
                        title="Delete line mapping"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Editable Register Address Input */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] text-slate-500 uppercase">Reg:</span>
                      <input
                        type="text"
                        value={reg.address}
                        onChange={e => updateLineRegisterAddress(reg.lineId, e.target.value)}
                        className="w-24 bg-white/[0.04] border border-white/10 focus:border-cyan-500 text-right text-[10px] text-slate-200 font-mono px-2 py-0.5 rounded-lg focus:outline-none"
                      />
                    </div>

                    {/* Current Value Display */}
                    <div className="flex items-center justify-between font-mono pt-0.5">
                      <span className="text-[10px] text-slate-400">Current:</span>
                      <span className="font-bold text-emerald-400 text-xs">{(reg.currentVal || 0).toLocaleString()}</span>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                      <span className="text-[9px] text-slate-500 truncate max-w-[80px]">
                        {reg.lastPulse ? `Last: ${reg.lastPulse}` : 'No pulse'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleManualPulse(reg.lineId, 10)}
                        className="liquid-pill px-2.5 py-0.5 rounded-full bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-[9px] font-bold text-cyan-300 cursor-pointer transition-all active:scale-95"
                      >
                        +10 Pulse
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Diagnostic Console */}
            <div className="bg-black/50 p-4 rounded-2xl border border-white/10 font-mono text-[11px] space-y-2.5 shadow-inner">
              <div className="text-slate-400 border-b border-white/10 pb-2 flex items-center justify-between flex-wrap gap-2">
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
                    className="liquid-pill px-2.5 py-0.5 bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 rounded-full text-[9px] font-bold border border-white/10 flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Copy className="w-2.5 h-2.5" />
                    <span>COPY</span>
                  </button>

                  <button
                    type="button"
                    onClick={clearLogs}
                    className="liquid-pill px-2.5 py-0.5 bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-slate-200 rounded-full text-[9px] font-bold border border-white/10 cursor-pointer active:scale-95"
                  >
                    CLEAR
                  </button>
                </div>
              </div>

              {/* Console Output Body */}
              <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar text-slate-300 font-mono text-[11px]">
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
        <div className="lg:col-span-4 liquid-glass-card border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4 font-mono text-xs text-slate-300 h-fit shadow-xl">
          <h3 className="font-bold text-slate-100 border-b border-white/10 pb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Seed Data Lineage & Driver Status</span>
          </h3>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/10 space-y-3">
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
