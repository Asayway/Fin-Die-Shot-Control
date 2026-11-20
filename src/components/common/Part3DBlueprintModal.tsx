import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  RotateCw, 
  Eye, 
  Camera, 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  ShieldCheck, 
  AlertTriangle, 
  Calculator, 
  CheckCircle2, 
  ExternalLink,
  Download,
  Maximize2,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { UnifiedPartMasterRow } from '../../views/PartMasterView';
import { storageService, PartWorkpiecePhotoMeta } from '../../services/storageService';

interface Part3DBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  partRow: UnifiedPartMasterRow | null;
  onPhotoSaved?: () => void;
}

export const Part3DBlueprintModal: React.FC<Part3DBlueprintModalProps> = ({
  isOpen,
  onClose,
  partRow,
  onPhotoSaved
}) => {
  const [activeTab, setActiveTab] = useState<'PHOTO_VIEWPORT' | 'CALCULATION_LADDER'>('PHOTO_VIEWPORT');
  const [currentPhoto, setCurrentPhoto] = useState<PartWorkpiecePhotoMeta | null>(null);
  
  // Viewport Zoom & Pan state
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Uploader Mode State
  const [isUploaderOpen, setIsUploaderOpen] = useState<boolean>(false);
  const [uploadSourceType, setUploadSourceType] = useState<'FILE' | 'URL'>('FILE');
  const [urlInputValue, setUrlInputValue] = useState<string>('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing photo for the part whenever partRow changes or modal opens
  useEffect(() => {
    if (!partRow || !isOpen) return;

    const existingPhoto = storageService.getPartPhoto(partRow.partCode);
    if (existingPhoto) {
      setCurrentPhoto(existingPhoto);
      setIsUploaderOpen(false);
    } else {
      // Check if partRow has legacy imageUrl
      const legacyUrl = (partRow as any).imageUrl;
      if (legacyUrl) {
        setCurrentPhoto({
          partCode: partRow.partCode,
          imageUrl: legacyUrl,
          sourceType: 'EXTERNAL_URL',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'System'
        });
        setIsUploaderOpen(false);
      } else {
        setCurrentPhoto(null);
        setIsUploaderOpen(true); // Open uploader directly if no photo exists
      }
    }

    // Reset zoom and pan
    setZoomScale(1.0);
    setPanPosition({ x: 0, y: 0 });
    setPreviewImageUrl(null);
    setUrlInputValue('');
    setUploadError(null);
    setSaveSuccessToast(null);
    setActiveTab('PHOTO_VIEWPORT');
  }, [partRow, isOpen]);

  if (!isOpen || !partRow) return null;

  // Extract Spec values directly from partRow
  const newSpecNum = typeof partRow.newSpecMm === 'number'
    ? partRow.newSpecMm
    : parseFloat(String(partRow.shotLifeCycle?.partsSpec || '28.00').replace(/[^0-9.]/g, '')) || 28.00;

  const scrapLimitNum = typeof partRow.scrapLimitMm === 'number'
    ? partRow.scrapLimitMm
    : parseFloat(String(partRow.shotLifeCycle?.lowerSpecScrapLimit || '27.00').replace(/[^0-9.]/g, '')) || 27.00;

  const isDisposable = partRow.regrindStandard?.perGrindMm?.toLowerCase().includes('dispose') || partRow.maintenanceType === 'DISPOSE';

  const perGrindNum = isDisposable ? 0 : parseFloat(String(partRow.regrindStandard?.perGrindMm || '0.10').replace(/[^0-9.]/g, '')) || 0.10;

  const totalAllowableGrind = isDisposable ? 0 : Math.max(0, newSpecNum - scrapLimitNum);
  const maxCyclesCalculated = (isDisposable || perGrindNum <= 0) 
    ? 'Dispose' 
    : typeof partRow.regrindStandard?.regrindCycles === 'number'
      ? partRow.regrindStandard.regrindCycles
      : Math.floor(totalAllowableGrind / perGrindNum);

  // Zoom handlers
  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoomScale(1.0);
    setPanPosition({ x: 0, y: 0 });
  };

  // Pan / Drag handlers for large images
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1.0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - panPosition.x,
      y: e.clientY - panPosition.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1.0) return;
    setPanPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Image compression and resize helper (ensures fast storage and loading)
  const processImageFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, WEBP, GIF)');
      return;
    }

    setIsCompressing(true);
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
            setPreviewImageUrl(compressedDataUrl);
          } else {
            setPreviewImageUrl(e.target?.result as string);
          }
        } catch {
          setPreviewImageUrl(e.target?.result as string);
        } finally {
          setIsCompressing(false);
        }
      };
      img.onerror = () => {
        setUploadError('ไม่สามารถอ่านไฟล์รูปภาพได้ กรุณาลองใหม่อีกครั้ง');
        setIsCompressing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setUploadError('เกิดข้อผิดพลาดในการโหลดไฟล์รูปภาพ');
      setIsCompressing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // External URL preview loader
  const handleLoadUrlPreview = () => {
    setUploadError(null);
    const trimmed = urlInputValue.trim();
    if (!trimmed) {
      setUploadError('กรุณาระบุ URL รูปภาพ');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      setUploadError('URL ต้องขึ้นต้นด้วย https:// หรือ http://');
      return;
    }

    // Test image loading
    const testImg = new Image();
    testImg.onload = () => {
      setPreviewImageUrl(trimmed);
      setSelectedFileName('external-image-url');
      setUploadError(null);
    };
    testImg.onerror = () => {
      setUploadError('ไม่สามารถโหลดรูปภาพจาก URL ที่ระบุได้ กรุณาตรวจสอบลิงก์หรือสิทธิ์การเข้าถึงรูป');
    };
    testImg.src = trimmed;
  };

  // Save photo to storage
  const handleSavePhoto = () => {
    if (!previewImageUrl) {
      setUploadError('กรุณาเลือกหรือระบุรูปภาพก่อนกดบันทึก');
      return;
    }

    const newPhotoMeta: Omit<PartWorkpiecePhotoMeta, 'uploadedAt'> = {
      partCode: partRow.partCode,
      imageUrl: previewImageUrl,
      sourceType: uploadSourceType === 'FILE' ? 'LOCAL_UPLOAD' : 'EXTERNAL_URL',
      fileName: selectedFileName || `${partRow.partCode}-photo.jpg`,
      uploadedBy: 'Operator'
    };

    storageService.savePartPhoto(partRow.partCode, newPhotoMeta);
    setCurrentPhoto({
      ...newPhotoMeta,
      uploadedAt: new Date().toISOString()
    });
    onPhotoSaved?.();

    setIsUploaderOpen(false);
    setPreviewImageUrl(null);
    setUrlInputValue('');
    setSaveSuccessToast('บันทึกรูปถ่ายชิ้นงานจริงเรียบร้อยแล้ว!');
    setTimeout(() => setSaveSuccessToast(null), 3000);
  };

  // Delete photo from storage
  const handleDeletePhoto = () => {
    if (!window.confirm(`ยืนยันการลบรูปถ่ายชิ้นงานจริงของ ${partRow.partName} (${partRow.partCode}) ใช่หรือไม่?`)) {
      return;
    }
    storageService.removePartPhoto(partRow.partCode);
    setCurrentPhoto(null);
    onPhotoSaved?.();
    setIsUploaderOpen(true);
    setPreviewImageUrl(null);
    setSaveSuccessToast('ลบรูปถ่ายชิ้นงานจริงเรียบร้อยแล้ว');
    setTimeout(() => setSaveSuccessToast(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn select-none">
      <div className="bg-[#121316] border border-cyan-500/40 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* ======================================================== */}
        {/* 1. MODAL HEADER */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-[#18191e] border-b border-[#2d2e38] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  {partRow.stage}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  DWG: {partRow.drawingNo || 'DWG-STD-2025'}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Real Workpiece Photo & Specifications
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide mt-0.5 flex items-center gap-2 truncate">
                <span className="truncate">{partRow.partName}</span>
                <span className="text-xs font-normal text-slate-400 font-mono hidden md:inline flex-shrink-0">
                  (Ø5 & Ø7 Factory Standard)
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* View Mode Tabs */}
            <div className="flex items-center bg-[#0a0b0d] p-1 rounded-xl border border-[#2d2e38]">
              <button
                type="button"
                onClick={() => setActiveTab('PHOTO_VIEWPORT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'PHOTO_VIEWPORT'
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>รูปตัวอย่างชิ้นงานจริง</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('CALCULATION_LADDER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'CALCULATION_LADDER'
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>ตารางรอบเจียร (Grind Ladder)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#22222a] hover:bg-[#333340] text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/10 active:scale-95"
              title="ปิดหน้าต่าง (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast Notification */}
        {saveSuccessToast && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-6 py-2 text-xs font-bold font-mono text-emerald-300 flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {saveSuccessToast}
            </span>
            <button type="button" onClick={() => setSaveSuccessToast(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. MAIN VIEWPORT BODY */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-hidden p-3.5 sm:p-5 bg-[#0c0d10] flex flex-col justify-between min-h-0">
          
          {activeTab === 'PHOTO_VIEWPORT' ? (
            <div className="w-full h-full flex flex-col justify-between space-y-3 min-h-0">
              
              {/* Main Viewport Box */}
              <div className="w-full flex-1 bg-[#131419] border border-[#262732] rounded-2xl p-3 sm:p-4 flex flex-col justify-between relative shadow-2xl overflow-hidden min-h-[460px]">
                
                {/* Viewport Top HUD Controls Bar */}
                <div className="flex items-center justify-between z-20 gap-2 sm:gap-3 flex-wrap pb-2 border-b border-white/5">
                  
                  {/* Left Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-lg border border-cyan-500/40">
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{currentPhoto && !isUploaderOpen ? 'ชิ้นงานจริง (Workpiece Photo)' : 'ลงรูปถ่ายชิ้นงาน (Photo Uploader)'}</span>
                    </span>
                    
                    {currentPhoto && !isUploaderOpen && (
                      <span className="text-[11px] font-mono text-slate-400 bg-black/50 px-2.5 py-1 rounded-md border border-white/10">
                        Zoom: {Math.round(zoomScale * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Center Spec Quick Badges */}
                  <div className="hidden lg:flex items-center gap-3 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-xl border border-white/10 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">New Spec L₀:</span>
                      <strong className="text-emerald-400 font-bold">{newSpecNum.toFixed(2)} mm</strong>
                    </div>
                    <span className="text-slate-600">|</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Scrap Limit L<sub>min</sub>:</span>
                      <strong className="text-rose-400 font-bold">{scrapLimitNum.toFixed(2)} mm</strong>
                    </div>
                    <span className="text-slate-600">|</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Step Δl:</span>
                      <strong className="text-purple-300 font-bold">{isDisposable ? 'Dispose' : `${perGrindNum.toFixed(2)} mm`}</strong>
                    </div>
                    <span className="text-slate-600">|</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Max Cycles:</span>
                      <strong className="text-cyan-300 font-bold">
                        {typeof maxCyclesCalculated === 'number' ? `${maxCyclesCalculated} รอบ` : maxCyclesCalculated}
                      </strong>
                    </div>
                  </div>

                  {/* Right Action Controls */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {currentPhoto && !isUploaderOpen ? (
                      <>
                        {/* Zoom Controls */}
                        <div className="flex items-center bg-[#090a0d] p-0.5 rounded-lg border border-white/10">
                          <button
                            type="button"
                            onClick={handleZoomIn}
                            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                            title="ซูมขยาย (Zoom In)"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleZoomOut}
                            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                            title="ย่อขนาด (Zoom Out)"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleResetZoom}
                            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                            title="รีเซ็ตขนาด 100% (Reset Zoom)"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Replace / Change Photo Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsUploaderOpen(true);
                            setPreviewImageUrl(null);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                          title="เปลี่ยนรูปถ่ายชิ้นงานใหม่"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>เปลี่ยนรูป</span>
                        </button>

                        {/* Delete Photo Button */}
                        <button
                          type="button"
                          onClick={handleDeletePhoto}
                          className="p-1.5 rounded-lg text-xs bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-rose-100 cursor-pointer active:scale-95 transition-all"
                          title="ลบรูปถ่ายชิ้นงานนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      currentPhoto && (
                        <button
                          type="button"
                          onClick={() => setIsUploaderOpen(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono bg-[#22222a] hover:bg-[#333340] border border-white/10 text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>กลับไปดูรูปถ่าย</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Main Viewport Content Area */}
                <div className="w-full flex-1 flex items-center justify-center relative overflow-hidden my-2 rounded-xl bg-black/40 border border-white/5">
                  
                  {/* Subtle Grid Lines Texture */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px]" />

                  {/* SCENARIO A: DISPLAYING PHOTO VIEWPORT */}
                  {currentPhoto && !isUploaderOpen ? (
                    <div 
                      className={`w-full h-full flex items-center justify-center p-4 relative ${
                        zoomScale > 1.0 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                      }`}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <div
                        className="transition-transform duration-100 ease-out flex items-center justify-center max-w-full max-h-full"
                        style={{
                          transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
                          transformOrigin: 'center center'
                        }}
                      >
                        <img 
                          src={currentPhoto.imageUrl} 
                          alt={partRow.partName}
                          className="max-h-[440px] max-w-full object-contain rounded-lg shadow-2xl border border-white/10 select-none pointer-events-none"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            setUploadError('ไม่สามารถโหลดภาพจากแหล่งข้อมูลนี้ได้ ลิงก์อาจเสียหรือถูกลบไปแล้ว');
                          }}
                        />
                      </div>

                      {/* Floating Bottom Metadata Badge */}
                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-3 text-xs font-mono bg-black/75 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 pointer-events-auto">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span className="font-bold text-white truncate">{partRow.partName}</span>
                          <span className="text-slate-400">({partRow.partCode})</span>
                        </div>

                        <div className="flex items-center gap-3 text-slate-300 text-[11px] flex-shrink-0">
                          <span>
                            แหล่งที่มา: <strong className="text-cyan-300">{currentPhoto.sourceType === 'LOCAL_UPLOAD' ? 'ไฟล์จากเครื่อง' : 'URL ภายนอก'}</strong>
                          </span>
                          <span className="text-slate-600">|</span>
                          <span>
                            บันทึกเมื่อ: <strong className="text-slate-200">{new Date(currentPhoto.uploadedAt).toLocaleString('th-TH')}</strong>
                          </span>
                          <span className="text-slate-600">|</span>
                          <a
                            href={currentPhoto.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 font-bold"
                            title="เปิดรูปภาพขนาดเต็มในแท็บใหม่"
                          >
                            <span>เปิดเต็มจอ</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    
                    /* SCENARIO B: UPLOADER INTERFACE (EMPTY STATE OR CHANGE PHOTO) */
                    <div className="w-full max-w-2xl p-6 flex flex-col items-center justify-center space-y-4">
                      
                      {/* Upload Source Tabs: Local File vs External URL */}
                      <div className="flex items-center bg-[#181922] p-1 rounded-xl border border-white/10 w-full max-w-md">
                        <button
                          type="button"
                          onClick={() => {
                            setUploadSourceType('FILE');
                            setUploadError(null);
                          }}
                          className={`flex-1 py-2 text-xs font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            uploadSourceType === 'FILE'
                              ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Upload className="w-4 h-4" />
                          <span>อัปโหลดไฟล์จากเครื่อง</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUploadSourceType('URL');
                            setUploadError(null);
                          }}
                          className={`flex-1 py-2 text-xs font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            uploadSourceType === 'URL'
                              ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <LinkIcon className="w-4 h-4" />
                          <span>ระบุ URL ลิงก์รูปภาพ</span>
                        </button>
                      </div>

                      {/* Error Alert Display */}
                      {uploadError && (
                        <div className="w-full p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-center gap-2 font-mono">
                          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                      )}

                      {/* Upload Method A: File Drag & Drop / File Picker */}
                      {uploadSourceType === 'FILE' ? (
                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            previewImageUrl 
                              ? 'border-emerald-500/60 bg-emerald-950/20' 
                              : 'border-white/20 hover:border-cyan-400/60 bg-white/[0.02] hover:bg-white/[0.04]'
                          }`}
                        >
                          <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/png,image/jpeg,image/webp,image/gif" 
                            className="hidden" 
                            onChange={handleFileInputChange}
                          />

                          {isCompressing ? (
                            <div className="flex flex-col items-center space-y-2">
                              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                              <p className="text-xs font-mono text-cyan-300">กำลังประมวลผลและปรับขนาดภาพ...</p>
                            </div>
                          ) : previewImageUrl ? (
                            <div className="space-y-3 flex flex-col items-center">
                              <img 
                                src={previewImageUrl} 
                                alt="Preview" 
                                className="max-h-48 rounded-lg shadow-lg border border-white/20 object-contain"
                              />
                              <p className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" />
                                โหลดรูปสำเร็จ: {selectedFileName}
                              </p>
                              <span className="text-[11px] text-slate-400 underline">คลิกเพื่อเลือกรูปใหม่</span>
                            </div>
                          ) : (
                            <div className="space-y-2 flex flex-col items-center">
                              <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-1">
                                <Upload className="w-8 h-8" />
                              </div>
                              <h3 className="text-sm sm:text-base font-bold text-white">
                                ลากไฟล์รูปภาพชิ้นงานจริงมาวางที่นี่
                              </h3>
                              <p className="text-xs text-slate-400 max-w-sm">
                                หรือคลิกเพื่อเปิดเลือกไฟล์จากคอมพิวเตอร์ / โทรศัพท์ (รองรับ .PNG, .JPG, .WEBP)
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (

                        /* Upload Method B: External Image URL */
                        <div className="w-full space-y-3 bg-[#181922] p-5 rounded-2xl border border-white/10">
                          <label className="block text-xs font-mono font-bold text-slate-300">
                            URL รูปภาพจากภายนอก (Direct Image URL):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              value={urlInputValue}
                              onChange={(e) => setUrlInputValue(e.target.value)}
                              placeholder="https://example.com/images/part-punch-01.jpg"
                              className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                            />
                            <button
                              type="button"
                              onClick={handleLoadUrlPreview}
                              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs rounded-xl cursor-pointer transition-all active:scale-95 flex-shrink-0"
                            >
                              โหลดรูปภาพ
                            </button>
                          </div>

                          {previewImageUrl && (
                            <div className="mt-3 p-3 bg-black/40 rounded-xl border border-white/10 flex flex-col items-center space-y-2">
                              <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                โหลดรูปตัวอย่างสำเร็จ
                              </span>
                              <img 
                                src={previewImageUrl} 
                                alt="URL Preview" 
                                className="max-h-48 rounded-lg shadow-md border border-white/15 object-contain"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Save & Cancel Action Buttons */}
                      <div className="flex items-center gap-3 pt-2">
                        {currentPhoto && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsUploaderOpen(false);
                              setPreviewImageUrl(null);
                            }}
                            className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-[#22222a] hover:bg-[#333340] border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={!previewImageUrl}
                          onClick={handleSavePhoto}
                          className={`px-6 py-2 rounded-xl text-xs font-mono font-black transition-all cursor-pointer flex items-center gap-2 shadow-lg ${
                            previewImageUrl 
                              ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                              : 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/5'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>บันทึกรูปชิ้นงานจริง</span>
                        </button>
                      </div>

                    </div>
                  )}

                </div>

                {/* Viewport Bottom Hint Bar */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>รูปภาพจะถูกจัดเก็บในฐานข้อมูลของพาร์ท {partRow.partCode} และใช้แสดงผลในทุกจุดตรวจสอบ</span>
                  </div>
                  <span className="text-slate-500 hidden sm:inline">
                    รองรับรูปจากกล้องถ่ายภาพ, ไฟล์สแกน, และรูปจากโรงงาน
                  </span>
                </div>

              </div>
            </div>
          ) : (

            /* ======================================================== */
            /* TAB 2: GRIND LADDER SPECIFICATION TABLE                 */
            /* ======================================================== */
            <div className="w-full h-full flex flex-col justify-between space-y-3 min-h-0">
              
              {/* Grind Table Header Summary Bar */}
              <div className="flex items-center justify-between p-3.5 bg-[#14151a] rounded-xl border border-[#2a2b34] text-xs font-mono flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">ตารางคำนวณและสเปกการเจียรลับคม (Regrind Ladder Steps)</h3>
                    <p className="text-slate-400 text-[11px]">
                      พาร์ท: <strong className="text-slate-200">{partRow.partName}</strong> | มาตรฐานความยาวใหม่: <strong className="text-emerald-400">{newSpecNum.toFixed(2)} mm</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-300">
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">ระยะที่เจียรได้รวม</span>
                    <strong className="text-[#00FF00] font-bold text-sm">
                      {isDisposable ? '0.00 mm (Dispose)' : `${totalAllowableGrind.toFixed(2)} mm`}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">จำนวนรอบสูงสุด</span>
                    <strong className="text-purple-300 font-bold text-sm">
                      {typeof maxCyclesCalculated === 'number' ? `${maxCyclesCalculated} รอบ` : maxCyclesCalculated}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Grind Step Rows Table */}
              <div className="w-full flex-1 bg-[#14151a] border border-[#2a2b34] rounded-xl overflow-y-auto custom-scrollbar shadow-inner min-h-0">
                <table className="w-full text-xs font-mono text-left border-collapse">
                  <thead className="bg-[#1b1c24] text-slate-300 border-b border-[#2d2e3a] sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-4 text-center w-20">รอบที่ (Cycle)</th>
                      <th className="py-2.5 px-4">สถานะพาร์ท / รอบการซ่อมบำรุง</th>
                      <th className="py-2.5 px-4 text-center">ความยาวพาร์ทที่เหลือ (L)</th>
                      <th className="py-2.5 px-4 text-center">ระยะเจียรสะสม (Σ Δl)</th>
                      <th className="py-2.5 px-4 text-center">การประเมินสภาพและข้อควรระวัง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262732] bg-[#101115]">
                    {/* Cycle 0 (Brand New Part) */}
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-4 text-center font-bold text-[#00FF00] bg-[#00FF00]/5">0</td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ชิ้นส่วนใหม่จากโรงงาน (Brand New L₀)
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-white text-sm">{newSpecNum.toFixed(2)} mm</td>
                      <td className="py-2.5 px-4 text-center text-slate-400">0.00 mm</td>
                      <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">สมบูรณ์ 100% ตามมาตรฐาน DWG</td>
                    </tr>

                    {/* Step Iterations */}
                    {typeof maxCyclesCalculated === 'number' && maxCyclesCalculated > 0 && Array.from({ length: Math.min(20, maxCyclesCalculated) }, (_, idx) => {
                      const cycleNum = idx + 1;
                      const remLen = Math.max(scrapLimitNum, newSpecNum - cycleNum * perGrindNum);
                      const accumGrind = cycleNum * perGrindNum;
                      const isLast = cycleNum === maxCyclesCalculated;

                      return (
                        <tr key={cycleNum} className={`hover:bg-white/5 transition-colors ${isLast ? 'bg-amber-500/10' : ''}`}>
                          <td className="py-2.5 px-4 text-center font-bold text-slate-300">{cycleNum}</td>
                          <td className="py-2.5 px-4 text-slate-300">
                            {isLast ? (
                              <strong className="text-amber-400 font-bold">เจียรครั้งสุดท้าย (Final Allowed Regrind Cycle)</strong>
                            ) : (
                              `ผ่านการเจียรลับคมครั้งที่ ${cycleNum}`
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-purple-300 text-sm">{remLen.toFixed(2)} mm</td>
                          <td className="py-2.5 px-4 text-center text-slate-400">{accumGrind.toFixed(2)} mm</td>
                          <td className="py-2.5 px-4 text-center">
                            {isLast ? (
                              <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                ⚠️ ใกล้ถึงเกณฑ์ Scrap Limit
                              </span>
                            ) : (
                              <span className="text-slate-400">อยู่ในเกณฑ์สเปกใช้งานได้ปกติ</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Scrap Row */}
                    <tr className="bg-rose-500/10 hover:bg-rose-500/15 transition-colors">
                      <td className="py-2.5 px-4 text-center font-bold text-rose-400 bg-rose-500/10">&gt; Max</td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          หมดสเปก / ปลดระวาง (Scrap Standard)
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-rose-400 text-sm">&lt; {scrapLimitNum.toFixed(2)} mm</td>
                      <td className="py-2.5 px-4 text-center text-rose-300">&gt; {totalAllowableGrind.toFixed(2)} mm</td>
                      <td className="py-2.5 px-4 text-center text-rose-400 font-bold">ต้องปลดระวางและเปลี่ยนชิ้นใหม่ทันที</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* ======================================================== */}
        {/* 3. MODAL FOOTER */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 bg-[#18191c] border-t border-[#2d2e38] text-xs font-mono text-slate-400 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Fin Die Tooling Real Workpiece Photo & Standard Specifications Rev 2025</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-[#25262c] hover:bg-[#32333b] text-white font-bold rounded-lg border border-white/10 transition-colors cursor-pointer active:scale-95"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
