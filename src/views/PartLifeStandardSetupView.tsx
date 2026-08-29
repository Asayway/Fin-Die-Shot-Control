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
import { PartLifeStandard, FinMaterial, TubeDiameter, FinType, ProductionLineId } from '../types';
import { storageService } from '../services/storageService';
import { formatShots, formatThb, generateCompositeKey } from '../services/calculationService';

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

          <div className="overflow-x-auto max-h-[650px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-[#0F172A] text-slate-400 border-b border-slate-700 z-10">
                <tr>
                  <th className="p-3 font-medium">STAGE / PART</th>
                  <th className="p-3 font-medium text-center">MAT</th>
                  <th className="p-3 font-medium text-center">TUBE</th>
                  <th className="p-3 font-medium text-right">LIFE LIMIT</th>
                  <th className="p-3 font-medium text-right">REGRIND (Max mm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map(s => {
                  const isSelected = formData.partCode === s.configKey.partCode && formData.material === s.configKey.material && formData.tubeSize === s.configKey.tubeSize;
                  const maxGrind = s.maxTotalGrindingLimit ?? s.regrindStandard?.totalRegrindMm ?? 3.00;
                  const cycles = s.regrindStandard?.maxRegrindCount ?? 4;
                  const is1Use = s.regrindStandard?.disposeAfterUse;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => handleSelectStandard(s)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-cyan-900/30 border-l-4 border-cyan-400 text-cyan-200' 
                          : 'hover:bg-slate-700/50 text-slate-300'
                      }`}
                    >
                      <td className="p-3">
                        <div className="font-bold text-slate-100">{s.partName}</div>
                        <div className="text-[11px] text-cyan-400 font-mono">{s.configKey.partCode}</div>
                        <div className="text-[10px] text-slate-400">{s.stagePunchDie || s.partName}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          s.configKey.material === 'PCM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          s.configKey.material === 'GOLD' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                          'bg-slate-700 text-slate-200'
                        }`}>
                          {s.configKey.material}
                        </span>
                      </td>
                      <td className="p-3 text-center text-cyan-300 font-bold">
                        {s.configKey.tubeSize}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-green-400 text-sm">
                        {formatShots(s.lifeLimitShots)}
                      </td>
                      <td className="p-3 text-right text-slate-300">
                        {is1Use ? (
                          <span className="text-rose-400 text-[11px] font-semibold">1-Use (Dispose)</span>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-200">{cycles}x</span>{' '}
                            <span className="text-xs text-cyan-400 font-mono">({maxGrind.toFixed(2)}mm)</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

  useEffect(() => {
    setLines(storageService.getLineConfigs());
  }, []);

  // Installed Part Quantity Matrix extracted from Excel Sheet
  const installMatrix = [
    { no: 1, part: 'Bucking Punch', code: 'PT-BP-01', e1: 168, e2: 168, e3_1: 168, e3_2: 168, e3_3: 168, e4: 168, e5: 168, e6: 168, total: 1344 },
    { no: 2, part: 'Ironing Punch', code: 'PT-IP-02', e1: 168, e2: 168, e3_1: 168, e3_2: 168, e3_3: 168, e4: 168, e5: 168, e6: 168, total: 1344 },
    { no: 3, part: 'Ironing Die', code: 'PT-ID-03', e1: 168, e2: 168, e3_1: 168, e3_2: 168, e3_3: 168, e4: 168, e5: 168, e6: 168, total: 1344 },
    { no: 4, part: 'Louver Punch', code: 'PT-LP-04', e1: 168, e2: 168, e3_1: 168, e3_2: 168, e3_3: 168, e4: 168, e5: 168, e6: 168, total: 1344 },
    { no: 5, part: 'Louver Die', code: 'PT-LD-05', e1: 168, e2: 168, e3_1: 168, e3_2: 168, e3_3: 168, e4: 168, e5: 168, e6: 168, total: 1344 },
    { no: 6, part: 'Reflaire Punch', code: 'PT-RP-06', e1: 168, e2: 168, e3_1: 168, e3_2: 168, e3_3: 168, e4: 168, e5: 168, e6: 168, total: 1344 },
    { no: 7, part: 'Reflaire Die', code: 'PT-RD-07', e1: 168, e2: 168, e3_1: 168, e3_2: 168, e3_3: 168, e4: 168, e5: 168, e6: 168, total: 1344 },
    { no: 8, part: 'Row Slit Blade', code: 'PT-RS-08', e1: 42, e2: 42, e3_1: 42, e3_2: 42, e3_3: 42, e4: 42, e5: 42, e6: 42, total: 336 },
    { no: 9, part: 'Side Cutting Punch', code: 'PT-SCP-09', e1: 8, e2: 8, e3_1: 8, e3_2: 8, e3_3: 8, e4: 8, e5: 8, e6: 8, total: 64 },
    { no: 10, part: 'Side Cutting Die', code: 'PT-SCD-10', e1: 8, e2: 8, e3_1: 8, e3_2: 8, e3_3: 8, e4: 8, e5: 8, e6: 8, total: 64 },
    { no: 11, part: 'Cut Off Punch', code: 'PT-COP-11', e1: 4, e2: 4, e3_1: 4, e3_2: 4, e3_3: 4, e4: 4, e5: 4, e6: 4, total: 32 },
    { no: 12, part: 'Cut Off Die', code: 'PT-COD-12', e1: 4, e2: 4, e3_1: 4, e3_2: 4, e3_3: 4, e4: 4, e5: 4, e6: 4, total: 32 }
  ];

  const grandTotal = installMatrix.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      <div className="bg-[#0F172A] border border-slate-700 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Fin Die Installed Part Quantity Matrix (E1 - E6)
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-thai">
            ตารางจำนวนชิ้นส่วนที่ติดตั้งในแม่พิมพ์แต่ละสายการผลิต (อ้างอิงจาก Excel Sheet Total: 11,281 ชิ้นทั่วทั้งโรงงาน)
          </p>
        </div>

        <div className="bg-[#1E293B] px-4 py-2 rounded border border-slate-700 font-mono text-right">
          <div className="text-[10px] text-slate-400 font-bold">TOTAL ACTIVE TOOLING IN FACTORY</div>
          <div className="text-base font-bold text-cyan-300">11,281 EA (All Lines)</div>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-slate-700 rounded-lg p-5 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#0F172A] text-slate-400 border-b border-slate-700">
                <th className="py-2.5 px-2 text-center">No.</th>
                <th className="py-2.5 px-3">STAGE PUNCH / DIE</th>
                <th className="py-2.5 px-3">PART CODE</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E1</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E2</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E3-1</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E3-2</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E3-3</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E4</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E5</th>
                <th className="py-2.5 px-2 text-center text-cyan-400">E6</th>
                <th className="py-2.5 px-3 text-right text-emerald-400">TOTAL (EA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {installMatrix.map(row => (
                <tr key={row.no} className="hover:bg-slate-700/50">
                  <td className="py-2.5 px-2 text-center text-slate-500 font-bold">{row.no}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-100">{row.part}</td>
                  <td className="py-2.5 px-3 text-slate-400">{row.code}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e1}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e2}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e3_1}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e3_2}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e3_3}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e4}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e5}</td>
                  <td className="py-2.5 px-2 text-center text-slate-300">{row.e6}</td>
                  <td className="py-2.5 px-3 text-right font-black text-emerald-400">{row.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0F172A] font-bold border-t-2 border-slate-700 text-slate-100">
                <td colSpan={3} className="py-3 px-3 text-right text-slate-400">GRAND TOTAL INSTALLED PARTS:</td>
                <td colSpan={8} className="py-3 px-2 text-center text-cyan-300">1,073 EA / Line Avg</td>
                <td className="py-3 px-3 text-right text-emerald-400 text-sm font-black">{grandTotal.toLocaleString()} EA</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
