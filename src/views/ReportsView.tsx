import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Layers,
  FileSpreadsheet,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  Filter,
  UserCheck,
  Server,
  Calendar,
  Lock,
  Plus
} from 'lucide-react';
import { AuditLogEntry, AuditModuleType, AuditActionType, UserRole, User } from '../types';
import { storageService } from '../services/storageService';
import { formatShots, formatThb } from '../services/calculationService';
import { getRolePermissions } from '../services/authService';

export const ReportsView: React.FC = () => {
  const [replacements, setReplacements] = useState<any[]>([]);
  const [lineConfigs, setLineConfigs] = useState<any[]>([]);

  useEffect(() => {
    setReplacements(storageService.getReplacements());
    setLineConfigs(storageService.getLineConfigs());
  }, []);

  const handleExportCSV = () => {
    const data = storageService.getReplacements();
    const headers = 'ID,Timestamp,Line,DieCode,PartName,Type,ShotAtReplacement,Qty,Reason,Operator\n';
    const rows = data.map(d => `"${d.id}","${d.timestamp}","${d.lineId}","${d.dieCode}","${d.partName}","${d.replacementType}",${d.shotAtReplacement},${d.replacedQty},"${d.reason}","${d.operatorName}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinDie_Shot_Replacement_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Fin Die Tooling Analytics & MTBF Reports
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-600/80 shadow-sm ml-2">
              SAMPLE DATA - NOT FOR PRODUCTION
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            รายงานสถิติอัตราสิ้นเปลืองอะไหล่แม่พิมพ์ ค่าเฉลี่ยช็อตระหว่างการเปลี่ยน (MTBF) และประมาณการต้นทุน
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-all shadow font-mono"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>EXPORT CSV / EXCEL REPORT</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono">
          <div className="text-slate-400 text-xs font-bold">TOTAL TOOL CHANGEOVERS</div>
          <div className="text-2xl font-black text-cyan-300 mt-1">{replacements.length} Events</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 8 production lines</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono">
          <div className="text-slate-400 text-xs font-bold">AVG MTBF (MEAN SHOTS)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">48.2M Shots</div>
          <div className="text-[11px] text-slate-500 mt-1">Avg run before sharpening</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono">
          <div className="text-slate-400 text-xs font-bold">EST. SPARE CONSUMPTION</div>
          <div className="text-2xl font-black text-amber-300 mt-1">฿1,420,000</div>
          <div className="text-[11px] text-slate-500 mt-1">Rolling 90-day period</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono">
          <div className="text-slate-400 text-xs font-bold">RE-GRIND SAVINGS</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">฿3,850,000</div>
          <div className="text-[11px] text-slate-500 mt-1">Saved vs new tool purchase</div>
        </div>
      </div>

      {/* Stage Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <h3 className="font-bold text-slate-100 text-sm">
          Tooling Consumption & Life Performance Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
            <div className="text-slate-400 font-bold">Top High-Wear Stages (ความถี่ในการเปลี่ยนสูงสุด)</div>
            <div className="space-y-2">
              {[
                { name: 'Louver Punch (40M / 100M Standard)', wear: 97, count: 18 },
                { name: 'Side Cutting Punch (15M / 50M Standard)', wear: 88, count: 12 },
                { name: 'Ironing Punch (45M / 100M Standard)', wear: 78, count: 9 },
                { name: 'Cut Off Die (12M / 40M Standard)', wear: 65, count: 6 },
              ].map(item => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-slate-200">
                    <span>{item.name}</span>
                    <span className="font-bold text-amber-300">{item.count} Changes</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded overflow-hidden border border-slate-800">
                    <div className="bg-cyan-500 h-full" style={{ width: `${item.wear}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
            <div className="text-slate-400 font-bold">Material Abrasiveness Impact</div>
            <div className="space-y-2 text-slate-300 text-[11px]">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>PCM (Pre-Coated):</span>
                <span className="text-amber-400 font-bold">100% Base Wear Rate (Standard)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>GOLD (Hydrophilic):</span>
                <span className="text-cyan-400 font-bold">115% Faster Edge Blunting</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span>BARE (Bare Aluminum):</span>
                <span className="text-emerald-400 font-bold">85% Lower Tool Wear</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-thai">
              * ข้อมูลอ้างอิงจากเกณฑ์อายุการใช้งาน Excel 31.01.2025
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UserApprovalView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [replacements, setReplacements] = useState<any[]>([]);

  useEffect(() => {
    setUsers(storageService.getUsers());
    setReplacements(storageService.getReplacements());
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-cyan-400" />
          <span>Role-Based Access Control & Approvals (10 Roles)</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1 font-thai">
          จัดการสิทธิ์ผู้ใช้งาน (10 ระดับ: Operator, Maintenance Tech, Die Specialist, Tooling Engineer, Quality Inspector, Supervisor, Production Manager, Warehouse Specialist, Purchasing Officer, System Admin)
        </p>
      </div>

      {/* Users List */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
        <h3 className="font-bold text-slate-100 text-sm">System Users & Assigned RBAC Roles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map(u => (
            <div key={u.id} className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300">{u.name}</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                  {u.role}
                </span>
              </div>
              <div className="text-slate-300 font-thai">{u.nameTh}</div>
              <div className="text-slate-500 text-[10px] flex justify-between">
                <span>{u.department}</span>
                <span>ID: {u.employeeId}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [currentUser, setCurrentUser] = useState<User>(storageService.getCurrentUser());
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Correction Modal Form State
  const [correctionForm, setCorrectionForm] = useState<{
    module: AuditModuleType;
    originalRecordId: string;
    actionType: 'REPLACEMENT_CORRECTION' | 'SHOT_CORRECTION' | 'STOCK_CORRECTION' | 'REGRIND_CORRECTION';
    fieldChanged: string;
    oldValue: string;
    newValue: string;
    reason: string;
    isProductionImpacting: boolean;
  }>({
    module: 'REPLACEMENT',
    originalRecordId: 'REP-2026-0891',
    actionType: 'REPLACEMENT_CORRECTION',
    fieldChanged: 'usedShotAtReplacement',
    oldValue: '48,200,000',
    newValue: '47,500,000',
    reason: '',
    isProductionImpacting: true
  });

  const reload = () => {
    setLogs(storageService.getAuditLogs());
    setCurrentUser(storageService.getCurrentUser());
  };

  useEffect(() => {
    reload();
    const unsub = storageService.subscribe(reload);
    return () => unsub();
  }, []);

  const permissions = getRolePermissions(currentUser.role);
  const canPerformSafeCorrection = permissions.canApproveReplacementCorrections || permissions.canSubmitShotCorrections || permissions.canAdministerSystem;

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (log.auditId || '').toLowerCase().includes(term) ||
      (log.recordId || '').toLowerCase().includes(term) ||
      (log.user || log.userName || '').toLowerCase().includes(term) ||
      (log.reason || log.details || '').toLowerCase().includes(term) ||
      (log.fieldChanged || '').toLowerCase().includes(term) ||
      (log.ipReference || '').toLowerCase().includes(term);

    const matchModule = filterModule === 'ALL' || log.module === filterModule || log.actionCategory === filterModule;
    const matchAction = filterAction === 'ALL' || log.action === filterAction;

    return matchSearch && matchModule && matchAction;
  });

  const handleOpenCorrection = (log?: AuditLogEntry) => {
    if (log) {
      setCorrectionForm({
        module: (log.module as AuditModuleType) || 'REPLACEMENT',
        originalRecordId: log.recordId || log.id,
        actionType: 'REPLACEMENT_CORRECTION',
        fieldChanged: log.fieldChanged || 'quantity',
        oldValue: String(log.newValue || log.oldValue || ''),
        newValue: '',
        reason: '',
        isProductionImpacting: true
      });
    }
    setShowCorrectionModal(true);
    setErrorMsg(null);
  };

  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.reason.trim() || correctionForm.reason.trim().length < 5) {
      setErrorMsg('Mandatory Reason: A detailed explanation (minimum 5 characters) is required for safe corrections.');
      return;
    }

    const res = storageService.submitSafeCorrection({
      module: correctionForm.module,
      originalRecordId: correctionForm.originalRecordId,
      actionType: correctionForm.actionType,
      fieldChanged: correctionForm.fieldChanged,
      oldValue: correctionForm.oldValue,
      newValue: correctionForm.newValue,
      reason: correctionForm.reason,
      correctedData: {},
      isProductionImpacting: correctionForm.isProductionImpacting,
      approverName: currentUser.name
    });

    if (res.success) {
      setSuccessMsg(res.message);
      setShowCorrectionModal(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(res.error || 'Failed to submit correction');
    }
  };

  const handleExportAuditCSV = () => {
    const headers = 'Audit ID,Date Time,Module,Record ID,Action,Field Changed,Old Value,New Value,Reason,User,Role,IP Ref\n';
    const rows = logs.map(l => 
      `"${l.auditId || l.id}","${l.dateTime || l.timestamp}","${l.module || l.actionCategory}","${l.recordId || ''}","${l.action}","${l.fieldChanged || ''}","${String(l.oldValue || '').replace(/"/g, '""')}","${String(l.newValue || '').replace(/"/g, '""')}","${(l.reason || l.details || '').replace(/"/g, '""')}","${l.user || l.userName}","${l.role || l.userRole}","${l.ipReference || ''}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinDie_Immutable_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            System-Wide Immutable Audit Trail & Safe Correction Log
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            บันทึกประวัติการเปลี่ยนแปลงทั้งหมดตามมาตรฐาน IATF 16949 / ISO 9001 (ห้ามแก้ไขทับข้อมูลเดิม, มีระบบ Reversal & Safe Correction, บันทึก IP และเหตุผลประกอบทุกรายการ)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canPerformSafeCorrection && (
            <button
              onClick={() => handleOpenCorrection()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs transition-colors shadow font-mono"
            >
              <RotateCcw className="w-4 h-4" />
              <span>INITIATE SAFE CORRECTION</span>
            </button>
          )}

          <button
            onClick={handleExportAuditCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors shadow font-mono"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT AUDIT TRAIL</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-950/90 border border-rose-500 text-rose-300 rounded text-xs flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search Audit ID, Record ID, User, Reason, IP..."
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Module:</span>
            <select
              value={filterModule}
              onChange={e => setFilterModule(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Modules</option>
              <option value="REPLACEMENT">REPLACEMENT</option>
              <option value="SHOT">SHOT</option>
              <option value="REGRIND">REGRIND</option>
              <option value="SPARE_STOCK">SPARE_STOCK</option>
              <option value="CONFIGURATION">CONFIGURATION</option>
              <option value="STANDARD">STANDARD</option>
              <option value="USER_AUTH">USER_AUTH</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-400">Action:</span>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="REVERSAL">REVERSAL</option>
              <option value="REPLACEMENT_CORRECTION">REPLACEMENT_CORRECTION</option>
              <option value="SHOT_CORRECTION">SHOT_CORRECTION</option>
              <option value="STOCK_ADJUSTMENT">STOCK_ADJUSTMENT</option>
              <option value="APPROVAL">APPROVAL</option>
              <option value="REJECTION">REJECTION</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Audit Trail Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Append-Only Audit Log Records (Showing {filteredLogs.length} entries)
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">IATF 16949 / ISO 9001 Compliant</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3">AUDIT ID / TIME</th>
                <th className="py-2.5 px-2">MODULE</th>
                <th className="py-2.5 px-2">RECORD ID</th>
                <th className="py-2.5 px-2">ACTION</th>
                <th className="py-2.5 px-2">FIELD / VALUES (OLD &rarr; NEW)</th>
                <th className="py-2.5 px-3">REASON / DETAILS</th>
                <th className="py-2.5 px-2">USER & ROLE</th>
                <th className="py-2.5 px-2">IP / SESSION</th>
                <th className="py-2.5 px-2 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLogs.map(l => {
                const isReversal = l.action === 'REVERSAL' || (l.action && l.action.includes('CORRECTION'));
                return (
                  <tr key={l.id} className={`hover:bg-slate-800/50 ${isReversal ? 'bg-amber-950/20' : ''}`}>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-cyan-300">{l.auditId || l.id.slice(0, 14)}</div>
                      <div className="text-[10px] text-slate-500">{l.dateTime || l.timestamp}</div>
                    </td>

                    <td className="py-2.5 px-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {l.module || l.actionCategory || 'SYSTEM'}
                      </span>
                    </td>

                    <td className="py-2.5 px-2 font-bold text-slate-200">
                      {l.recordId || '-'}
                    </td>

                    <td className="py-2.5 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        l.action === 'REVERSAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : l.action.includes('CORRECTION')
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : l.action === 'APPROVAL'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-cyan-300 border border-slate-700'
                      }`}>
                        {l.action}
                      </span>
                    </td>

                    <td className="py-2.5 px-2 max-w-[200px]">
                      {l.fieldChanged && (
                        <div className="text-[10px] text-slate-400">Field: <span className="text-slate-200 font-semibold">{l.fieldChanged}</span></div>
                      )}
                      {(l.oldValue || l.newValue) && (
                        <div className="text-[10px] truncate text-slate-300">
                          <span className="text-rose-400 line-through">{String(l.oldValue || '')}</span> &rarr; <span className="text-emerald-400 font-bold">{String(l.newValue || '')}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 max-w-[240px]">
                      <div className="text-slate-200 truncate text-[11px] font-semibold">{l.reason || l.details}</div>
                      {l.detailsTh && <div className="text-[10px] text-slate-400 font-thai truncate">{l.detailsTh}</div>}
                    </td>

                    <td className="py-2.5 px-2">
                      <div className="text-slate-200 font-semibold">{l.userName || l.user}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{l.role || l.userRole}</div>
                    </td>

                    <td className="py-2.5 px-2 text-[10px] text-slate-400">
                      <div>{l.ipReference || '192.168.10.45'}</div>
                      <div className="text-slate-600">{l.sessionReference || 'SES-ACTIVE'}</div>
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      {canPerformSafeCorrection && (
                        <button
                          onClick={() => handleOpenCorrection(l)}
                          title="Initiate safe correction against this record"
                          className="px-2 py-1 bg-slate-800 hover:bg-amber-600 hover:text-slate-950 text-slate-300 rounded text-[10px] transition-colors"
                        >
                          Correct
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safe Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-lg w-full space-y-4 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                Initiate Safe Correction Workflow
              </h3>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-950/40 border border-amber-700/60 p-3 rounded text-[11px] text-amber-200">
              <strong>Strict IATF Audit Policy:</strong> Approved transactions are never silently overwritten. This operation will generate a linked reversal record and a replacement transaction.
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Target Module *</label>
                  <select
                    value={correctionForm.module}
                    onChange={e => setCorrectionForm({ ...correctionForm, module: e.target.value as AuditModuleType })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="REPLACEMENT">REPLACEMENT</option>
                    <option value="SHOT">SHOT</option>
                    <option value="REGRIND">REGRIND</option>
                    <option value="SPARE_STOCK">SPARE_STOCK</option>
                    <option value="CONFIGURATION">CONFIGURATION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Original Record ID *</label>
                  <input
                    type="text"
                    value={correctionForm.originalRecordId}
                    onChange={e => setCorrectionForm({ ...correctionForm, originalRecordId: e.target.value })}
                    placeholder="e.g. REP-2026-0891"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Field Name to Correct *</label>
                <input
                  type="text"
                  value={correctionForm.fieldChanged}
                  onChange={e => setCorrectionForm({ ...correctionForm, fieldChanged: e.target.value })}
                  placeholder="e.g. usedShotAtReplacement, quantity, position"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Old Value</label>
                  <input
                    type="text"
                    value={correctionForm.oldValue}
                    onChange={e => setCorrectionForm({ ...correctionForm, oldValue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-rose-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">New Corrected Value *</label>
                  <input
                    type="text"
                    value={correctionForm.newValue}
                    onChange={e => setCorrectionForm({ ...correctionForm, newValue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-emerald-400 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-amber-300 font-bold mb-1">Mandatory Reason (min 5 chars) *</label>
                <textarea
                  rows={3}
                  value={correctionForm.reason}
                  onChange={e => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  placeholder="Explain why this correction is required (e.g. Incorrect meter reading transcribed during Shift 2)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors shadow-lg"
                >
                  SUBMIT REVERSAL & SAFE CORRECTION
                </button>
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
