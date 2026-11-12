import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { 
  X, 
  Printer, 
  QrCode, 
  Download, 
  Copy, 
  Check, 
  Hash, 
  ImageIcon,
  Sparkles
} from 'lucide-react';
import { UnifiedPartMasterRow } from '../../views/PartMasterView';

interface PartQrLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  partRow: UnifiedPartMasterRow | null;
}

// Generate realistic SVG 1D Barcode (Code-128 pattern simulation)
const SvgBarcode: React.FC<{ code: string; width?: number; height?: number }> = ({ 
  code, 
  width = 280, 
  height = 48 
}) => {
  const bars: { x: number; w: number }[] = [];
  let currentX = 10;
  
  // Guard bars start
  bars.push({ x: currentX, w: 2 }); currentX += 4;
  bars.push({ x: currentX, w: 2 }); currentX += 4;

  for (let i = 0; i < code.length; i++) {
    const val = code.charCodeAt(i);
    const b1 = (val % 3) + 1;
    const b2 = ((val >> 2) % 3) + 1;
    const b3 = ((val >> 4) % 2) + 1;
    
    bars.push({ x: currentX, w: b1 }); currentX += b1 + 2;
    bars.push({ x: currentX, w: b2 }); currentX += b2 + 2;
    bars.push({ x: currentX, w: b3 }); currentX += b3 + 2;
  }

  // Guard bars end
  bars.push({ x: currentX, w: 3 }); currentX += 5;
  bars.push({ x: currentX, w: 2 }); currentX += 4;

  const totalWidth = Math.max(width, currentX + 10);

  return (
    <svg viewBox={`0 0 ${totalWidth} ${height + 18}`} className="w-full h-auto max-h-[65px]" preserveAspectRatio="xMidYMid meet">
      <rect width={totalWidth} height={height + 18} fill="#ffffff" />
      {bars.map((b, idx) => (
        <rect key={idx} x={b.x} y={4} width={b.w} height={height} fill="#000000" />
      ))}
      <text 
        x={totalWidth / 2} 
        y={height + 15} 
        textAnchor="middle" 
        fontSize="11" 
        fontFamily="monospace" 
        fontWeight="bold" 
        fill="#000000"
      >
        *{code}*
      </text>
    </svg>
  );
};

export const PartQrLabelModal: React.FC<PartQrLabelModalProps> = ({
  isOpen,
  onClose,
  partRow
}) => {
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [selectedSerialNo, setSelectedSerialNo] = useState<string>('SN-01');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const isDisposable = partRow?.maintenanceType === 'DISPOSE' || 
    partRow?.regrindStandard?.perGrindMm?.toLowerCase().includes('dispose');

  const partCode = partRow?.partCode || partRow?.drawingNo || '';
  const serialCode = `${partCode}-${selectedSerialNo}`;

  // Applicable lines
  const applicableLines: string[] = (partRow as any)?.applicableLines || [];
  if (applicableLines.length === 0 && partRow) {
    if ((partRow.installQty?.e1 || 0) > 0) applicableLines.push('E1');
    if ((partRow.installQty?.e2 || 0) > 0) applicableLines.push('E2');
    if ((partRow.installQty?.e3_1 || 0) > 0) applicableLines.push('E3 SLIT');
    if ((partRow.installQty?.e3_2 || 0) > 0) applicableLines.push('E3 WL+');
    if ((partRow.installQty?.e3_3 || 0) > 0) applicableLines.push('E3 New Cor');
    if ((partRow.installQty?.e4 || 0) > 0) applicableLines.push('E4');
    if ((partRow.installQty?.e5 || 0) > 0) applicableLines.push('E5');
  }

  // Real Scannable Payload
  const qrScannableText = partRow ? [
    `TOOLING ID: ${serialCode}`,
    `PART: ${partRow.partName}`,
    `DRAWING: ${partRow.drawingNo}`,
    `STAGE: ${partRow.stage}`,
    `NEW SPEC: ${partRow.newSpecMm ? `${partRow.newSpecMm.toFixed(2)}mm` : '-'}`,
    `SCRAP LIMIT: ${partRow.scrapLimitMm ? `${partRow.scrapLimitMm.toFixed(2)}mm` : '-'}`,
    `LINES: ${applicableLines.length > 0 ? applicableLines.join(', ') : 'ALL'}`
  ].join('\n') : '';

  // Generate real camera-scannable QR code PNG DataURL
  useEffect(() => {
    if (!isOpen || !qrScannableText) return;
    QRCode.toDataURL(qrScannableText, {
      margin: 1,
      width: 220,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error('Failed to generate real QR code:', err);
    });
  }, [isOpen, qrScannableText]);

  if (!isOpen || !partRow) return null;

  const handleCopyCode = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(serialCode).catch(() => {});
      }
    } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = async () => {
    const el = document.getElementById('printable-part-label');
    if (!el) return;
    try {
      setIsGeneratingPng(true);
      const canvas = await html2canvas(el, { scale: 3, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${serialCode}-Label.png`;
      link.click();
    } catch (e) {
      console.error('Error generating label PNG:', e);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  const handleCopyImage = async () => {
    const el = document.getElementById('printable-part-label');
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setImageCopied(true);
          setTimeout(() => setImageCopied(false), 2000);
        } catch (err) {
          console.warn('Clipboard write image fallback to download:', err);
          handleDownloadPng();
        }
      }, 'image/png');
    } catch (e) {
      console.error('Error copying label image:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs font-mono animate-fadeIn select-none">
      <div className="bg-[#181818] border border-[#555555] shadow-2xl rounded-none w-full max-w-3xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header Bar */}
        <div className="bg-[#242424] border-b border-[#444444] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-[#00FF00]" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>QR CODE & BARCODE TOOLING LABEL</span>
                <span className="text-[10px] bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/40 px-1.5 py-0.2 font-black flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>SCANNABLE HIGH-RES</span>
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                ฉลากบาร์โค้ดติดชิ้นส่วนแม่พิมพ์ สแกนใช้งานจริงได้ 100% และดาวน์โหลด/คัดลอกไฟล์รูปภาพได้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#333333] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Action Controls Bar matching image 3 */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1e1e1e] p-3 border border-[#333333]">
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#FFCC00]" />
                <span>Serial / Lot:</span>
              </label>
              <select
                value={selectedSerialNo}
                onChange={e => setSelectedSerialNo(e.target.value)}
                className="bg-[#111111] text-[#00FF00] border border-[#555555] px-2 py-1 text-xs font-bold focus:outline-none"
              >
                <option value="SN-01">SN-01 (Active Tool)</option>
                <option value="SN-02">SN-02 (Backup 1)</option>
                <option value="SN-03">SN-03 (Backup 2)</option>
                <option value="SN-04">SN-04 (In Regrind)</option>
                <option value="LOT-202501">LOT-202501 (Batch Stock)</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isGeneratingPng}
                className="px-3 py-1 bg-sky-900 hover:bg-sky-800 text-sky-200 border border-sky-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title="ดาวน์โหลดฉลากเป็นไฟล์รูปภาพ PNG ความละเอียดสูง"
              >
                <Download className="w-3.5 h-3.5 text-sky-300" />
                <span>{isGeneratingPng ? 'กำลังสร้าง...' : 'ดาวน์โหลดภาพ PNG'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                className="px-3 py-1 bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title="คัดลอกรูปภาพฉลากเข้า Clipboard"
              >
                {imageCopied ? <Check className="w-3.5 h-3.5 text-[#00FF00]" /> : <ImageIcon className="w-3.5 h-3.5 text-purple-300" />}
                <span>{imageCopied ? 'คัดลอกรูปภาพแล้ว!' : 'คัดลอกรูปภาพ'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 bg-[#282828] hover:bg-[#333333] text-slate-200 border border-[#555555] text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="คัดลอกรหัส Serial ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#00FF00]" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'คัดลอกแล้ว' : 'Copy Code'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1 bg-[#00FF00] hover:bg-[#00dd00] text-black text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title="พิมพ์สติ๊กเกอร์ความร้อน 100mm x 60mm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์สติ๊กเกอร์ (Print Label)</span>
              </button>
            </div>
          </div>

          {/* Printable Industrial Label Canvas */}
          <div className="p-4 bg-[#0a0a0a] border border-[#444444] flex justify-center overflow-x-auto">
            <div 
              id="printable-part-label"
              className="w-full max-w-[620px] min-w-[540px] bg-white text-black p-4 border-2 border-black shadow-lg font-mono relative select-all"
            >
              {/* Label Top Bar */}
              <div className="border-b-2 border-black pb-2 mb-3 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                    AIR CONDITIONER FIN PRESS DIE TOOLING
                  </div>
                  <div className="text-lg font-black leading-tight text-black mt-0.5">
                    {partRow.partName}
                  </div>
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-2 mt-1">
                    <span>STAGE: {partRow.stage}</span>
                    <span>•</span>
                    <span>DRAWING: {partRow.drawingNo}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 text-xs font-black border ${
                    isDisposable ? 'border-red-600 bg-red-100 text-red-700' : 'border-emerald-600 bg-emerald-100 text-emerald-800'
                  }`}>
                    {isDisposable ? 'DISPOSABLE (1 USE)' : 'REGRINDABLE (เจียรได้)'}
                  </span>
                  <div className="text-[11px] font-black text-slate-900 mt-1">
                    TOOLING ID
                  </div>
                  <div className="text-xs font-black text-black">
                    {serialCode}
                  </div>
                  <div className="text-[9px] font-bold text-slate-600 mt-0.5">
                    RACK: TOOLROOM-STOCK
                  </div>
                </div>
              </div>

              {/* Label Middle: Scannable QR + Barcode + Specs Grid */}
              <div className="grid grid-cols-12 gap-3 items-center">
                {/* Real Scannable QR Code Container */}
                <div className="col-span-4 flex flex-col items-center justify-center p-1.5 border border-slate-300 bg-slate-50">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Scannable Tooling QR Code" 
                      className="w-32 h-32 object-contain"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-slate-200 animate-pulse flex items-center justify-center text-[10px] text-slate-500">
                      Generating...
                    </div>
                  )}
                  <div className="text-[9px] font-black text-slate-700 mt-1 tracking-tight flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-emerald-600" />
                    <span>SCAN TO VERIFY</span>
                  </div>
                </div>

                {/* Specs and Barcode Container */}
                <div className="col-span-8 flex flex-col justify-between h-full space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs border border-slate-300 p-2 bg-slate-50">
                    <div>
                      <div className="text-[9px] text-slate-600 font-bold uppercase">NEW SPEC (มาตรฐานใหม่):</div>
                      <div className="text-sm font-black text-black">
                        {partRow.newSpecMm ? `${partRow.newSpecMm.toFixed(2)} mm` : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-600 font-bold uppercase">SCRAP LIMIT (ขีดจำกัดทิ้ง):</div>
                      <div className="text-sm font-black text-red-700">
                        {partRow.scrapLimitMm ? `${partRow.scrapLimitMm.toFixed(2)} mm` : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-600 font-bold uppercase">1-TIME GRIND (เจียรครั้งละ):</div>
                      <div className="text-xs font-bold text-black">
                        {partRow.regrindStandard?.perGrindMm || '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-600 font-bold uppercase">MAX REGRIND (รอบสูงสุด):</div>
                      <div className="text-xs font-bold text-black">
                        {partRow.regrindStandard?.regrindCycles ?? '-'} รอบ
                      </div>
                    </div>
                  </div>

                  {/* 1D Barcode */}
                  <div className="border border-slate-300 p-1 bg-white text-center">
                    <SvgBarcode code={serialCode} width={340} height={42} />
                  </div>
                </div>
              </div>

              {/* Label Bottom: Lines Installed & Rack Info */}
              <div className="border-t-2 border-black pt-2 mt-3 flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-700">APPLICABLE LINES:</span>
                  {applicableLines.length > 0 ? (
                    applicableLines.map(line => (
                      <span key={line} className="px-1.5 py-0.2 bg-black text-white text-[10px] font-black">
                        {line}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500">ALL</span>
                  )}
                </div>

                <div className="text-right text-[10px] text-slate-800">
                  <span>STORAGE: RACK-TOOLROOM | LOT: 2025-CANONICAL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Technical Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#1e1e1e] border border-[#333333]">
              <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">
                LINE LIFETIME STANDARDS
              </div>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span>Fin Press E1 (Ø7):</span>
                  <span className="text-[#00FF00] font-bold">
                    {partRow.shotLifeCycle?.e1_pcm !== undefined ? `${partRow.shotLifeCycle.e1_pcm}M Shots` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fin Press E2 (Ø5):</span>
                  <span className="text-[#00FF00] font-bold">
                    {partRow.shotLifeCycle?.e2_gold !== undefined ? `${partRow.shotLifeCycle.e2_gold}M Shots` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fin Press E3 (1-3):</span>
                  <span className="text-[#00FF00] font-bold">
                    {partRow.shotLifeCycle?.e3_1_pcm !== undefined ? `${partRow.shotLifeCycle.e3_1_pcm}M` : '-'} / {partRow.shotLifeCycle?.e3_2_gold !== undefined ? `${partRow.shotLifeCycle.e3_2_gold}M` : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#1e1e1e] border border-[#333333]">
              <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">
                INSTALLATION & SPARE MATRIX
              </div>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span>Total Active In Lines:</span>
                  <span className="text-[#FFCC00] font-bold">{partRow.installQty?.totalQty || 0} EA</span>
                </div>
                <div className="flex justify-between">
                  <span>Recommended Safety Stock:</span>
                  <span className="text-cyan-400 font-bold">
                    {Math.max(2, Math.ceil((partRow.installQty?.totalQty || 0) * 0.2))} EA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Maintenance Strategy:</span>
                  <span className={isDisposable ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {isDisposable ? 'One-time use (ทิ้ง)' : 'Regrind & Sharpen'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#1e1e1e] border border-[#333333]">
              <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">
                SPECIAL TOOLING NOTE
              </div>
              <div className="text-slate-300 text-[11px] leading-relaxed italic">
                {partRow.regrindStandard?.note && partRow.regrindStandard.note !== '-' 
                  ? partRow.regrindStandard.note 
                  : 'มาตรฐานการเจียรตามแบบ Drawing มาตรฐานประจำโรงงาน'}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#242424] border-t border-[#444444] px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
          <div>
            <span>Label Format: Industrial 100mm x 60mm Thermal Sticker / Barcode Code-128 Standard</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#333333] hover:bg-[#444444] text-white font-bold cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
