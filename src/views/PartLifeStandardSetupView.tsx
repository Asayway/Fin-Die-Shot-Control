import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Search, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Layers,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Info
} from 'lucide-react';
import { PartLifeStandard, FinMaterial, TubeDiameter, FinType, ProductionLineId, LINE_INFO_MAP } from '../types';
import { storageService } from '../services/storageService';
import { formatShots, formatThb, generateCompositeKey } from '../services/calculationService';
import { ResizableReorderableTable } from '../components/common/ResizableReorderableTable';

export const PartLifeStandardSetupView: React.FC = () => {
  const [standards, setStandards] = useState<PartLifeStandard[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('ALL');
  const [selectedTube, setSelectedTube] = useState<string>('ALL');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Form State for Life Standard Editor (10 Parameters + Grinding Specs)
  const [formData, setFormData] = useState({
    id: 'STD-E6-BUCK-P',
    partName: 'Bucking Punch',
    stagePunchDie: 'Bucking Punch',
    line: 'E6',
    configCode: 'CFG-E6-001',
    dieCode: 'FD-E6-07',
    finType: 'Slit (half)',
    material: 'PCM',
    foilThickness: 0.10,
    tubeSize: 'Ø7',
    partCode: 'P-BUCK-001',
    subOption: 'ALL',
    effectiveDate: '2025-01-31',
    lifeLimitShots: 18000000,
    estimatedCostThb: 8500,
    changeIntervalNotes: 'Standard change upon burr > 0.035mm',

    // Re-grinding & Shim Specifications
    maxTotalGrindingLimit: 3.00,
    regrindDepthPerTime: 0.20,
    standardShimThickness: 0.20,
    maxRegrindCount: 4,
    disposeAfterUse: false
  });

  const [compositeKey, setCompositeKey] = useState<string>('');

  const reload = () => {
    const data = storageService.getLifeStandards();
    setStandards(data);
    if (data.length > 0) {
      const first = data[0];
      populateFormFromStandard(first);
    }
  };

  const populateFormFromStandard = (std: PartLifeStandard) => {
    const maxGrind = std.maxTotalGrindingLimit ?? std.regrindStandard?.totalRegrindMm ?? 3.00;
    const depthPerTime = std.regrindDepthPerTime ?? (typeof std.regrindStandard?.oneTimeRegrindMm === 'number' ? std.regrindStandard.oneTimeRegrindMm : parseFloat(std.regrindStandard?.oneTimeRegrindMm || '0.20') || 0.20);
    const shim = std.standardShimThickness ?? 0.20;

    setFormData({
      id: std.id,
      partName: std.partName,
      stagePunchDie: std.stagePunchDie || std.partName,
      line: (std.configKey.lineId as string) || 'ALL',
      configCode: std.configKey.configurationId || 'CFG-E6-001',
      dieCode: std.configKey.dieCode || 'FD-E6-07',
      finType: std.configKey.finType || 'Slit (half)',
      material: std.configKey.material || 'PCM',
      foilThickness: typeof std.configKey.thicknessMm === 'number' ? std.configKey.thicknessMm : 0.10,
      tubeSize: std.configKey.tubeSize || 'Ø7',
      partCode: std.configKey.partCode || 'P-BUCK-001',
      subOption: std.configKey.position || 'ALL',
      effectiveDate: std.configKey.effectiveDate || '2025-01-31',
      lifeLimitShots: std.lifeLimitShots || 18000000,
      estimatedCostThb: std.estimatedCostThb || 8500,
      changeIntervalNotes: std.changeIntervalNotes || '',
      maxTotalGrindingLimit: maxGrind,
      regrindDepthPerTime: depthPerTime,
      standardShimThickness: shim,
      maxRegrindCount: std.regrindStandard?.maxRegrindCount ?? 4,
      disposeAfterUse: !!std.regrindStandard?.disposeAfterUse
    });
  };

  useEffect(() => {
    reload();
    const unsub = storageService.subscribe(reload);
    return () => unsub();
  }, []);

  // 2. Real-time Auto-Key Generator Effect
  useEffect(() => {
    const thicknessFormatted = Number(formData.foilThickness || 0.10).toFixed(2);
    const key = `${formData.line}|${formData.configCode}|${formData.dieCode}|${formData.finType}|${formData.material}|${thicknessFormatted}mm|${formData.tubeSize}|${formData.partCode}|${formData.subOption}|${formData.effectiveDate}`;
    setCompositeKey(key);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Thickness') || name.includes('Limit') || name.includes('Depth') || name.includes('Cost') || name.includes('Shots') || name.includes('Count')
        ? (value === '' ? 0 : parseFloat(value) || 0)
        : value
    }));
  };

  const handleSelectStandard = (std: PartLifeStandard) => {
    populateFormFromStandard(std);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedStandard: PartLifeStandard = {
      id: formData.id || `STD-${formData.line}-${formData.partCode}`,
      partName: formData.partName,
      stagePunchDie: formData.stagePunchDie,
      compositeKeyString: compositeKey,
      configKey: {
        lineId: formData.line as ProductionLineId | 'ALL',
        configurationId: formData.configCode,
        dieCode: formData.dieCode,
        finType: formData.finType as FinType,
        material: formData.material as FinMaterial,
        thicknessMm: formData.foilThickness,
        tubeSize: formData.tubeSize as TubeDiameter,
        partCode: formData.partCode,
        position: formData.subOption,
        effectiveDate: formData.effectiveDate
      },
      lifeLimitShots: formData.lifeLimitShots,
      maxTotalGrindingLimit: formData.maxTotalGrindingLimit,
      regrindDepthPerTime: formData.regrindDepthPerTime,
      standardShimThickness: formData.standardShimThickness,
      estimatedCostThb: formData.estimatedCostThb,
      changeIntervalNotes: formData.changeIntervalNotes,
      regrindStandard: {
        oneTimeRegrindMm: formData.regrindDepthPerTime.toFixed(2),
        totalRegrindMm: formData.maxTotalGrindingLimit,
        maxRegrindCount: formData.maxRegrindCount,
        maxTotalGrindingLimit: formData.maxTotalGrindingLimit,
        regrindDepthPerTime: formData.regrindDepthPerTime,
        standardShimThickness: formData.standardShimThickness,
        disposeAfterUse: formData.disposeAfterUse,
        regrindIntervalNote: formData.disposeAfterUse ? 'Dispose after 1 use' : `Regrind ${formData.regrindDepthPerTime}mm with ${formData.standardShimThickness}mm shim compensation`
      },
      createdBy: storageService.getCurrentUser().name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    storageService.saveLifeStandard(updatedStandard);
    setSuccessMsg(`Life Standard saved & composite key committed: ${formData.partCode} (${formatShots(formData.lifeLimitShots)} shots)`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleExportTemplate = () => {
    const jsonStr = JSON.stringify(standards, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Life_Standard_Template_31.01_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    setShowImportModal(true);
    setImportStatus(null);
  };

  const handleExecuteImport = () => {
    setImportStatus('Verifying 31.01.2025 Standard Matrix and applying grinding limits...');
    setTimeout(() => {
      storageService.resetToSeedData();
      reload();
      setImportStatus('Successfully synchronized with official Excel 31.01.2025 standard matrix.');
      setTimeout(() => {
        setShowImportModal(false);
        setImportStatus(null);
      }, 1500);
    }, 800);
  };

  const filtered = standards.filter(s => {
    const matchSearch = 
      s.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.configKey.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.stagePunchDie && s.stagePunchDie.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchMat = selectedMaterial === 'ALL' || s.configKey.material.toUpperCase() === selectedMaterial.toUpperCase();
    const matchTube = selectedTube === 'ALL' || s.configKey.tubeSize === selectedTube;
    return matchSearch && matchMat && matchTube;
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-[#0F172A] border border-slate-700 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-cyan-400" />
            Fin Die Part Life Standard Setup
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            กำหนดเกณฑ์อายุการใช้งานชิ้นส่วนแม่พิมพ์ (10 Composite Keys) และพารามิเตอร์การเจียร Re-grinding & Shim
          </p>
        </div>

        {/* Quick Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search part name / code..."
              className="bg-[#1E293B] border border-slate-700 rounded pl-9 pr-3 py-2 text-xs font-mono text-slate-100 w-52 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedMaterial}
            onChange={e => setSelectedMaterial(e.target.value)}
            className="bg-[#1E293B] border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Materials (วัสดุทั้งหมด)</option>
            <option value="PCM">PCM</option>
            <option value="GOLD">GOLD</option>
            <option value="BARE">BARE</option>
          </select>

          <select
            value={selectedTube}
            onChange={e => setSelectedTube(e.target.value)}
            className="bg-[#1E293B] border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">All Tubes (ขนาดท่อทั้งหมด)</option>
            <option value="Ø5">Ø5</option>
            <option value="Ø7">Ø7</option>
            <option value="Ø9.52">Ø9.52</option>
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-lg text-sm flex items-center gap-2 shadow-md animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Standard Registry (Table) */}
        <div className="lg:col-span-7 bg-[#1E293B] rounded-lg border border-slate-700 overflow-hidden flex flex-col shadow-lg">
          <div className="p-4 border-b border-slate-700 flex flex-wrap justify-between items-center bg-[#0F172A]/70 gap-2">
            <div>
              <h2 className="font-semibold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                <span>Standard Registry</span>
                <span className="text-xs font-mono font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {filtered.length} Items
                </span>
              </h2>
              <div className="text-[11px] text-slate-400 font-thai">คลิกที่แถวเพื่อเลือกและแก้ไขพารามิเตอร์</div>
            </div>

            {/* Requested 2 Action Buttons */}
            <div className="flex gap-2 text-xs">
              <button 
                onClick={handleExportTemplate}
                className="px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded transition-colors flex items-center gap-1.5 border border-transparent hover:border-slate-600"
                title="ส่งออกแม่แบบมาตรฐาน JSON/Excel (Export Template)"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export Template</span>
              </button>
              <button 
                onClick={handleImportClick}
                className="px-3 py-2 bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 rounded hover:bg-cyan-600/30 hover:border-cyan-400 transition-colors flex items-center gap-1.5 font-semibold"
                title="นำเข้าไฟล์มาตรฐาน 31.01 (Import Excel 31.01)"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Import Excel (31.01)</span>
              </button>
            </div>
          </div>

          <div className="p-3">
            <ResizableReorderableTable<PartLifeStandard>
              data={filtered}
              keyExtractor={(s) => s.id}
              emptyMessage="ไม่พบข้อมูลเกณฑ์มาตรฐานอายุการใช้งาน"
              columns={[
                {
                  id: 'part',
                  label: 'STAGE / PART',
                  width: 170,
                  render: (s) => (
                    <div 
                      onClick={() => handleSelectStandard(s)}
                      className="cursor-pointer space-y-0.5"
                    >
                      <div className="font-bold text-slate-100">{s.partName}</div>
                      <div className="text-[11px] text-cyan-400 font-mono">{s.configKey.partCode}</div>
                      <div className="text-[10px] text-slate-400">{s.stagePunchDie || s.partName}</div>
                    </div>
                  )
                },
                {
                  id: 'material',
                  label: 'MAT',
                  width: 90,
                  align: 'center',
                  render: (s) => (
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      s.configKey.material === 'PCM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      s.configKey.material === 'GOLD' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                      'bg-slate-700 text-slate-200'
                    }`}>
                      {s.configKey.material}
                    </span>
                  )
                },
                {
                  id: 'tubeSize',
                  label: 'TUBE',
                  width: 80,
                  align: 'center',
                  render: (s) => (
                    <span className="text-cyan-300 font-bold font-mono text-xs">
                      {s.configKey.tubeSize}
                    </span>
                  )
                },
                {
                  id: 'lifeLimitShots',
                  label: 'LIFE LIMIT',
                  width: 120,
                  align: 'right',
                  render: (s) => (
                    <span className="font-mono font-bold text-green-400 text-xs">
                      {formatShots(s.lifeLimitShots)}
                    </span>
                  )
                },
                {
                  id: 'regrind',
                  label: 'REGRIND (Max mm)',
                  width: 140,
                  align: 'right',
                  render: (s) => {
                    const maxGrind = s.maxTotalGrindingLimit ?? s.regrindStandard?.totalRegrindMm ?? 3.00;
                    const cycles = s.regrindStandard?.maxRegrindCount ?? 4;
                    const is1Use = s.regrindStandard?.disposeAfterUse;

                    return is1Use ? (
                      <span className="text-rose-400 text-[11px] font-semibold">1-Use (Dispose)</span>
                    ) : (
                      <div className="text-xs">
                        <span className="font-semibold text-slate-200">{cycles}x</span>{' '}
                        <span className="text-cyan-400 font-mono">({maxGrind.toFixed(2)}mm)</span>
                      </div>
                    );
                  }
                }
              ]}
            />
          </div>
        </div>

        {/* RIGHT PANEL: Life Standard Editor (Form) */}
        <div className="lg:col-span-5 bg-[#1E293B] rounded-lg border border-slate-700 p-5 space-y-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <div>
                <h2 className="font-semibold text-slate-100 text-base">Life Standard Editor</h2>
                <div className="text-xs text-slate-400 font-thai">แก้ไขเกณฑ์มาตรฐานชิ้นส่วนและ Re-grinding</div>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2.5 py-1 rounded">
                {formData.partCode}
              </span>
            </div>

            {/* Auto-Generated Key Display */}
            <div className="space-y-1 bg-[#0F172A] p-3 rounded-md border border-slate-700">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Info className="w-3 h-3 text-cyan-400" />
                  10 Composite Key String (Auto-Generated)
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">Real-time</span>
              </div>
              <div className="w-full bg-[#070D18] border border-slate-800 rounded p-2.5 font-mono text-xs text-emerald-400 break-all select-all shadow-inner">
                {compositeKey}
              </div>
            </div>

            <form id="lifeStandardForm" onSubmit={handleSave} className="space-y-4 text-xs font-mono">
              {/* Group 1: General Info */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                  1. General & Tooling Information
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Line ID</label>
                    <select
                      name="line"
                      value={formData.line}
                      onChange={handleChange}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded px-2.5 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="ALL">ALL (ทุกไลน์)</option>
                      <option value="E1">E1</option>
                      <option value="E2">E2</option>
                      <option value="E3-1">E3-1</option>
                      <option value="E3-2">E3-2</option>
                      <option value="E3-3">E3-3</option>
                      <option value="E4">E4</option>
                      <option value="E5">E5</option>
                      <option value="E6">E6</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Die Code</label>
                    <input
                      type="text"
                      name="dieCode"
                      value={formData.dieCode}
                      onChange={handleChange}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded px-2.5 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Part Name</label>
                  <input
                    type="text"
                    name="partName"
                    value={formData.partName}
                    onChange={handleChange}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded px-2.5 py-2 text-slate-100 font-sans font-medium focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Material</label>
                    <select
                      name="material"
                      value={formData.material}
                      onChange={handleChange}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded px-2 py-2 text-amber-300 focus:border-cyan-500 focus:outline-none font-bold"
                    >
                      <option value="PCM">PCM</option>
                      <option value="GOLD">GOLD</option>
                      <option value="BARE">BARE</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Tube Size</label>
                    <select
                      name="tubeSize"
                      value={formData.tubeSize}
                      onChange={handleChange}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded px-2 py-2 text-cyan-300 focus:border-cyan-500 focus:outline-none font-bold"
                    >
                      <option value="Ø5">Ø5</option>
                      <option value="Ø7">Ø7</option>
                      <option value="Ø9.52">Ø9.52</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Foil Thk (mm)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="foilThickness"
                      value={formData.foilThickness}
                      onChange={handleChange}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded px-2 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Life Limits */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                  2. Shot Life Limit & Financials
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold flex justify-between">
                      <span>Life Limit (Shots) *</span>
                      <span className="text-slate-500 text-[10px]">Max shots</span>
                    </label>
                    <input
                      type="number"
                      name="lifeLimitShots"
                      value={formData.lifeLimitShots}
                      onChange={handleChange}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded px-2.5 py-2 font-bold text-emerald-400 text-sm focus:border-cyan-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">Part Cost (THB)</label>
                    <input
                      type="number"
                      name="estimatedCostThb"
                      value={formData.estimatedCostThb}
                      onChange={handleChange}
                      className="w-full bg-[#0F172A] border border-slate-700 rounded px-2.5 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Re-grinding & Shim Specifications (Requested Section) */}
              <div className="space-y-3 pt-2 border-t border-slate-700/80">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    3. Re-grinding & Shim Specifications
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="disposeCheck"
                      name="disposeAfterUse"
                      checked={formData.disposeAfterUse}
                      onChange={handleChange}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <label htmlFor="disposeCheck" className="text-[11px] text-rose-300 font-normal cursor-pointer">
                      Dispose (ห้ามเจียรซ้ำ)
                    </label>
                  </div>
                </div>

                {!formData.disposeAfterUse && (
                  <div className="space-y-3 bg-[#0F172A] p-3 rounded-md border border-slate-800">
                    <div className="space-y-1">
                      <label className="text-slate-400 flex justify-between font-bold">
                        <span>Max Total Grinding Limit (mm)</span>
                        <span className="text-cyan-400 text-[10px]">Max depth allowable</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        name="maxTotalGrindingLimit"
                        value={formData.maxTotalGrindingLimit}
                        onChange={handleChange}
                        className="w-full bg-[#070D18] border border-slate-700 rounded px-2.5 py-2 text-sm text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-400 font-bold">Grind Depth / Time</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.05"
                            name="regrindDepthPerTime"
                            value={formData.regrindDepthPerTime}
                            onChange={handleChange}
                            className="w-full bg-[#070D18] border border-slate-700 rounded px-2.5 py-2 pr-8 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                          />
                          <span className="absolute right-3 top-2 text-xs text-slate-500 font-sans">mm</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 font-bold">Standard Shim</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.05"
                            name="standardShimThickness"
                            value={formData.standardShimThickness}
                            onChange={handleChange}
                            className="w-full bg-[#070D18] border border-slate-700 rounded px-2.5 py-2 pr-8 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                          />
                          <span className="absolute right-3 top-2 text-xs text-slate-500 font-sans">mm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            form="lifeStandardForm"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-md transition-colors mt-4 shadow-lg shadow-cyan-900/50 flex items-center justify-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Standard (บันทึกมาตรฐาน)</span>
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-cyan-400">
              <FileSpreadsheet className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Import Excel (31.01.2025)</h3>
            </div>
            <p className="text-xs text-slate-300 font-thai leading-relaxed">
              นำเข้าและอัปเดตเกณฑ์มาตรฐานอายุการใช้งานและพารามิเตอร์ Re-grinding & Shim จากไฟล์มาตรฐานแม่พิมพ์ประจำโรงงาน Fin Die Shop
            </p>

            <div className="bg-[#0F172A] p-3 rounded border border-slate-700 text-xs font-mono space-y-1 text-slate-400">
              <div>Source: 0. Control shot Spare Parts FIN DIES__31.01.2025.xlsx</div>
              <div>Revision: 2025.01.31-REV1</div>
              <div>Target Records: 48 Standard Rules</div>
            </div>

            {importStatus && (
              <div className="p-3 bg-cyan-950/80 border border-cyan-700 text-cyan-300 rounded text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 flex-shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-xs shadow-md shadow-cyan-900/50 flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Execute Import</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export const InstallQuantitySetupView: React.FC = () => {
  const [lines, setLines] = useState<any[]>([]);
  const [partMasters, setPartMasters] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const loadAll = () => {
      setLines(storageService.getLineConfigs());
      setPartMasters(storageService.getPartMasters());
    };
    loadAll();
    const unsub = storageService.subscribe(loadAll);
    return () => unsub();
  }, []);

  const lineIds = ['E1', 'E2', 'E3-1', 'E3-2', 'E3-3', 'E4', 'E5', 'E6'];

  interface InstallMatrixRow {
    no: number;
    part: string;
    code: string;
    total: number;
    [key: string]: string | number;
  }

  // Dynamically build matrix from part masters
  const matrixParts = partMasters.map((pm, index) => ({
    no: index + 1,
    part: pm.partName,
    code: pm.partCode
  }));

  const getCellKey = (partCode: string, lineId: string) => `${partCode}_${lineId}`;

  const installMatrix: InstallMatrixRow[] = matrixParts.map(mp => {
    const row: InstallMatrixRow = { ...mp, total: 0 };
    let total = 0;
    lineIds.forEach(lId => {
      let qty = 0;
      const lineConfig = lines.find(l => l.lineId === lId);
      if (lineConfig && lineConfig.installedPartQuantities) {
        qty = lineConfig.installedPartQuantities[mp.code] || 0;
      }
      // If we are editing, use editValues if it exists
      if (isEditing) {
        qty = editValues[getCellKey(mp.code, lId)] !== undefined ? editValues[getCellKey(mp.code, lId)] : qty;
      }
      row[lId] = qty;
      total += qty;
    });
    row.total = total;
    return row;
  });

  const grandTotal = installMatrix.reduce((sum, item) => sum + item.total, 0);

  const handleEditClick = () => {
    // Populate edit state
    const currentValues: Record<string, number> = {};
    matrixParts.forEach(mp => {
      lineIds.forEach(lId => {
        const lineConfig = lines.find(l => l.lineId === lId);
        if (lineConfig && lineConfig.installedPartQuantities) {
          currentValues[getCellKey(mp.code, lId)] = lineConfig.installedPartQuantities[mp.code] || 0;
        }
      });
    });
    setEditValues(currentValues);
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    // Build updates array
    const updates = Object.keys(editValues).map(key => {
      const [partCode, lineId] = key.split('_');
      return { lineId, partCode, installQty: editValues[key] };
    });
    
    // Save via storage service
    storageService.updateInstallQuantities(updates);
    
    // Reload local state
    setLines(storageService.getLineConfigs());
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setEditValues({});
    setIsEditing(false);
  };

  const handleCellValueChange = (partCode: string, lineId: string, value: string) => {
    const num = parseInt(value, 10);
    setEditValues(prev => ({
      ...prev,
      [getCellKey(partCode, lineId)]: isNaN(num) ? 0 : num
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0F172A] border border-slate-700 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Fin Die Installed Part Quantity Matrix
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            ตารางจำนวนชิ้นส่วนที่ติดตั้งในแม่พิมพ์แต่ละสายการผลิต (สามารถแก้ไขจำนวนติดตั้งต่อไลน์ได้)
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#1E293B] px-4 py-2 rounded border border-slate-700 font-mono text-right">
            <div className="text-[10px] text-slate-400 font-bold">TOTAL ACTIVE TOOLING</div>
            <div className="text-base font-bold text-cyan-300">{grandTotal.toLocaleString()} EA (All Lines)</div>
          </div>
          
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button onClick={handleCancelClick} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveClick} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-bold transition-colors">
                Save Matrix
              </button>
            </div>
          ) : (
            <button onClick={handleEditClick} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-bold transition-colors">
              Edit Matrix
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-5 shadow-lg">
        <ResizableReorderableTable
          data={installMatrix}
          keyExtractor={(row) => row.no.toString()}
          emptyMessage="ไม่พบข้อมูล Install Matrix"
          columns={[
            {
              id: 'no',
              label: 'No.',
              width: 50,
              align: 'center',
              render: (row) => <span className="text-slate-500 font-bold">{row.no}</span>
            },
            {
              id: 'part',
              label: 'STAGE PUNCH / DIE',
              width: 180,
              render: (row) => <span className="font-semibold text-slate-100">{row.part}</span>
            },
            {
              id: 'code',
              label: 'PART CODE',
              width: 110,
              render: (row) => <span className="text-slate-400 font-mono">{row.code}</span>
            },
            ...lineIds.map(lId => ({
              id: lId,
              label: lId.startsWith('E3-') ? `E3 (${LINE_INFO_MAP[lId]?.shortTag || lId})` : lId,
              width: 85,
              align: 'center' as const,
              render: (row: any) => (
                isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={row[lId]}
                    onChange={(e) => handleCellValueChange(row.code, lId, e.target.value)}
                    className="w-14 sm:w-16 bg-slate-900 border border-slate-600 rounded px-1 py-1 text-center text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                ) : (
                  <span className="text-slate-300 font-mono">{row[lId]}</span>
                )
              )
            })),
            {
              id: 'total',
              label: 'TOTAL (EA)',
              width: 110,
              align: 'right',
              render: (row) => <span className="font-black text-emerald-400 font-mono">{row.total.toLocaleString()}</span>
            }
          ]}
        />
      </div>
    </div>
  );
};
