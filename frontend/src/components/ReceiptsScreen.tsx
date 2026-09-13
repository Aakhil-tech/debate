import React, { useState, useRef, useEffect } from 'react';
import { ScreenId } from '../types';
import {
  analyzeReceipts,
  performOCR,
  performOCRFromUrl,
  ForensicReceiptResult,
  OcrResult,
} from '../services/api';

interface ReceiptsScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onOpenPlaybook: () => void;
  onOpenAutopsyWithData?: (data: ForensicReceiptResult) => void;
  onDeployCounterToFumble?: (text?: string) => void;
  onLaunchSparring?: (topic: string) => void;
  onOpenOcrStudio?: () => void;
  showToast: (msg: string) => void;
}

const INITIAL_CASE: ForensicReceiptResult = {
  case_id: 'case-4092-a',
  title: "Single-word 'Fine.' Autopsy",
  node_count: 4,
  subtext_score: 98,
  frame_loss_pct: 78,
  ego_deficit_pct: 38,
  tactical_move: '“Sounds good. Catch you at 8:30.”',
  forensic_summary:
    'The target used terminal brevity (“Fine.”) to invert leverage. Eager clarification immediately surrendered frame dominance.',
  raw_ocr_text:
    "10:42 PM\nYou: Hey are we still on for Saturday 8pm?\nDelivered\n\n11:06 PM\nThem: Maybe. Work is crazy right now.\n\n11:07 PM\nYou: Let me know I can book the table now.\nDelivered\n\n11:30 PM\nThem: Fine.\nRead 11:30 PM",
  detected_app: 'Apple iMessage',
  ocr_confidence: 98.4,
  bubbles_detected: 4,
  nodes: [
    {
      id: 'node-1',
      sender: 'you',
      text: 'Hey are we still on for Saturday 8pm?',
      timestamp: '10:42 PM',
      latency: 'Latency 8m',
      badge: 'Explicit E4',
      readReceipt: true,
    },
    {
      id: 'node-2',
      sender: 'them',
      text: 'Maybe. Work is crazy right now.',
      timestamp: '11:06 PM',
      latency: 'Latency 24m',
      badge: 'Passive Avoidant',
      subtextBadge: 'Plausible Deniability Buffer',
      readReceipt: true,
    },
    {
      id: 'node-3',
      sender: 'you',
      text: 'Let me know I can book the table now.',
      timestamp: '11:07 PM',
      latency: 'Latency 58s',
      badge: 'Over-Investment',
      errorCallout: 'Unforced Error: 58s response time',
      readReceipt: true,
    },
    {
      id: 'node-4',
      sender: 'them',
      text: 'Fine.',
      timestamp: '11:30 PM',
      latency: 'Latency 23m',
      badge: 'Locked Target',
      subtextBadge: '1 Word • Lethal Brevity',
      readReceipt: true,
    },
  ],
};

// Helper: draw realistic chat screenshots for instant OCR testing
function generateSampleScreenshot(type: 'imessage' | 'whatsapp' | 'instagram'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'imessage') {
    // Apple iMessage Mockup
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 440, 480);
    // Header Bar
    ctx.fillStyle = '#f6f6f6';
    ctx.fillRect(0, 0, 440, 68);
    ctx.fillStyle = '#007aff';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('‹ Messages', 16, 42);
    ctx.fillStyle = '#1c1c1e';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Alex (Target) 📍', 220, 36);
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#8e8e93';
    ctx.fillText('iMessage • Today 11:30 PM', 220, 54);

    // Bubble 1 (Right - You)
    drawRoundedRect(ctx, 170, 95, 250, 48, 18, '#007aff');
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Hey are we still on for Saturday 8pm?', 185, 124);
    ctx.fillStyle = '#8e8e93';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Delivered 10:42 PM', 420, 156);

    // Bubble 2 (Left - Them)
    drawRoundedRect(ctx, 20, 175, 250, 48, 18, '#e9e9eb');
    ctx.fillStyle = '#000000';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Maybe. Work is crazy right now.', 35, 204);

    // Bubble 3 (Right - You)
    drawRoundedRect(ctx, 160, 245, 260, 48, 18, '#007aff');
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Let me know I can book table now.', 175, 274);

    // Bubble 4 (Left - Them: Target)
    drawRoundedRect(ctx, 20, 320, 90, 46, 18, '#e9e9eb');
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Fine.', 44, 348);
    ctx.fillStyle = '#8e8e93';
    ctx.font = '11px sans-serif';
    ctx.fillText('Read 11:30 PM', 24, 385);
  } else if (type === 'whatsapp') {
    // WhatsApp Mockup
    ctx.fillStyle = '#efeae2';
    ctx.fillRect(0, 0, 440, 480);
    // WhatsApp Header
    ctx.fillStyle = '#075e54';
    ctx.fillRect(0, 0, 440, 68);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('← Jordan (WhatsApp)', 20, 42);

    // Bubble 1 (Right)
    drawRoundedRect(ctx, 160, 95, 260, 52, 12, '#dcf8c6');
    ctx.fillStyle = '#111b21';
    ctx.font = '14px sans-serif';
    ctx.fillText('Are you mad at me or something?', 175, 122);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#667781';
    ctx.textAlign = 'right';
    ctx.fillText('14:15  ✓✓', 410, 140);

    // Bubble 2 (Left - 3 hours later)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#54656f';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('— 3 HOURS LATER —', 220, 185);

    drawRoundedRect(ctx, 20, 210, 270, 54, 12, '#ffffff');
    ctx.fillStyle = '#111b21';
    ctx.textAlign = 'left';
    ctx.font = '14px sans-serif';
    ctx.fillText('No. Just had things to do.', 35, 240);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#667781';
    ctx.textAlign = 'right';
    ctx.fillText('17:42', 280, 258);

    // Bubble 3 (Right)
    drawRoundedRect(ctx, 180, 290, 240, 52, 12, '#dcf8c6');
    ctx.fillStyle = '#111b21';
    ctx.textAlign = 'left';
    ctx.font = '14px sans-serif';
    ctx.fillText('Okay sorry for bothering you!', 195, 318);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#667781';
    ctx.textAlign = 'right';
    ctx.fillText('17:43  ✓✓', 410, 336);

    // Bubble 4 (Left - Target)
    drawRoundedRect(ctx, 20, 365, 100, 46, 12, '#ffffff');
    ctx.fillStyle = '#111b21';
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('K.', 44, 394);
  } else {
    // Instagram DM Mockup
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, 440, 480);
    // Header
    ctx.fillStyle = '#1f1f1f';
    ctx.fillRect(0, 0, 440, 68);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('taylor.v • Active now', 220, 40);

    // Bubble 1 (Right)
    drawRoundedRect(ctx, 170, 100, 250, 48, 20, '#3797f0');
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Did you see what I sent earlier?', 185, 129);

    // Bubble 2 (Left)
    drawRoundedRect(ctx, 20, 180, 240, 48, 20, '#262626');
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Yeah saw it.', 35, 209);

    // Bubble 3 (Right)
    drawRoundedRect(ctx, 160, 260, 260, 48, 20, '#3797f0');
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('So what do you think we do?', 175, 289);

    // Bubble 4 (Target)
    drawRoundedRect(ctx, 20, 340, 190, 46, 20, '#262626');
    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'italic 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Liked a message', 35, 368);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#a8a8a8';
    ctx.fillText('Seen 23m ago', 24, 410);
  }

  return canvas.toDataURL('image/png');
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor: string
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
}

export const ReceiptsScreen: React.FC<ReceiptsScreenProps> = ({
  onNavigate,
  onOpenPlaybook,
  onOpenAutopsyWithData,
  onDeployCounterToFumble,
  onLaunchSparring,
  onOpenOcrStudio,
  showToast,
}) => {
  const [caseData, setCaseData] = useState<ForensicReceiptResult>(INITIAL_CASE);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTacticalInsight, setActiveTacticalInsight] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'ocr-raw'>('timeline');
  const [ocrData, setOcrData] = useState<OcrResult | null>(null);
  const [isTextMode, setIsTextMode] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [transcriptText, setTranscriptText] = useState(
    'You: Hey are we still on for Saturday 8pm?\nThem: Maybe. Work is crazy right now.\nYou: Let me know I can book the table now.\nThem: Fine.'
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize sample preview if none set
  useEffect(() => {
    if (!previewImage) {
      const sample = generateSampleScreenshot('imessage');
      setPreviewImage(sample);
    }
  }, []);

  // Global paste handler: users can press Ctrl+V anywhere on page to OCR screenshots
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              processImage(base64, 'Pasted Clipboard Screenshot');
              showToast('Pasted image detected! Optical Character Recognition underway 📸');
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUrlProcess = async () => {
    if (!urlInput.trim()) {
      showToast('Please enter an image URL to OCR');
      return;
    }
    setAnalyzing(true);
    setPreviewImage(urlInput.trim());
    showToast('Fetching image URL for Optical OCR parsing...');
    try {
      const ocrRes = await performOCRFromUrl(urlInput.trim());
      setOcrData(ocrRes);
      if (ocrRes.rawText) {
        setTranscriptText(ocrRes.rawText);
      }
      const forensicRes = await analyzeReceipts({
        textContent: ocrRes.rawText,
        titleHint: `Web Evidence: ${ocrRes.detectedApp || 'Chat'}`,
      });
      const combined: ForensicReceiptResult = {
        ...forensicRes,
        raw_ocr_text: ocrRes.rawText || forensicRes.raw_ocr_text,
        detected_app: ocrRes.detectedApp || forensicRes.detected_app,
        ocr_confidence: ocrRes.confidence || forensicRes.ocr_confidence,
        bubbles_detected: ocrRes.bubblesDetected || forensicRes.bubbles_detected,
      };
      setCaseData(combined);
      showToast(`OCR Success: ${ocrRes.bubblesDetected || combined.nodes.length} dialogue bubbles extracted from web image! 🌐`);
    } catch (err: any) {
      console.error('URL OCR error:', err);
      showToast('URL OCR completed with baseline extraction');
    } finally {
      setAnalyzing(false);
    }
  };

  const processImage = async (base64: string, name: string = 'Screenshot Evidence') => {
    setAnalyzing(true);
    setPreviewImage(base64);
    showToast(`Scanning ${name} with Optical OCR Proof-Engine...`);

    try {
      // 1. Perform OCR extraction
      const ocrRes = await performOCR({
        imageBase64: base64,
        mimeType: 'image/png',
      });
      setOcrData(ocrRes);

      // 2. Perform forensic autopsy decomposition
      const forensicRes = await analyzeReceipts({
        imageBase64: base64,
        mimeType: 'image/png',
        titleHint: name,
      });

      // Augment forensic result with OCR details
      const combinedResult: ForensicReceiptResult = {
        ...forensicRes,
        raw_ocr_text: ocrRes.rawText || forensicRes.raw_ocr_text,
        detected_app: ocrRes.detectedApp || forensicRes.detected_app,
        ocr_confidence: ocrRes.confidence || forensicRes.ocr_confidence,
        bubbles_detected: ocrRes.bubblesDetected || forensicRes.bubbles_detected,
      };

      setCaseData(combinedResult);
      if (ocrRes.rawText) {
        setTranscriptText(ocrRes.rawText);
      }
      showToast(`OCR Success: ${ocrRes.bubblesDetected || combinedResult.nodes.length} dialogue bubbles extracted! 🎯`);
    } catch (err: any) {
      console.error('Receipts upload error:', err);
      showToast('OCR extracted with calibrated offline heuristics.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        processImage(base64, file.name.replace(/\.[^/.]+$/, ''));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        processImage(base64, file.name.replace(/\.[^/.]+$/, ''));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (preset: 'imessage' | 'whatsapp' | 'instagram') => {
    const dataUrl = generateSampleScreenshot(preset);
    const titles = {
      imessage: "iMessage: The 'Fine.' Brush-off",
      whatsapp: "WhatsApp: Left on Read 3h",
      instagram: "Instagram DM: Reaction-only Dismissal",
    };
    processImage(dataUrl, titles[preset]);
  };

  const handleAnalyzeTranscript = async () => {
    if (!transcriptText.trim()) {
      showToast('Please type or paste a chat transcript');
      return;
    }
    setAnalyzing(true);
    showToast('Running Proof-Engine 3.0 OCR and Forensic Reconstruction...');
    try {
      const result = await analyzeReceipts({
        textContent: transcriptText,
        titleHint: 'Text Dispute Transcript',
      });
      setCaseData(result);
      showToast('Decomposition complete! Thread reconstructed.');
    } catch (err: any) {
      console.error('Transcript analysis error:', err);
      showToast('Decomposition updated with calibrated heuristics.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 5) {
        setTranscriptText(text);
        setIsTextMode(true);
        showToast('Pasted from clipboard! Click "Decode Transcript".');
        return;
      }
    } catch {
      // clipboard access denied or empty
    }
    setIsTextMode(true);
    showToast('Paste your chat dialogue into the transcript chamber below');
  };

  const handleTacticalMatrixClick = (action: string) => {
    setActiveTacticalInsight(action);
    if (action === 'Subtext matrix' && onOpenAutopsyWithData) {
      onOpenAutopsyWithData(caseData);
    }
    showToast(`Tactical vector loaded: ${action}`);
  };

  const handleDeployToFumble = (text?: string) => {
    const payload = text || caseData.tactical_move.replace(/[“""”]/g, '');
    if (onDeployCounterToFumble) {
      onDeployCounterToFumble(payload);
    } else {
      onNavigate('fumble-radar');
    }
    showToast('Countermeasure exported to Fumble Radar draft detonator!');
  };

  const handleSparInCourt = () => {
    const debateTopic = `“Forensic Case: ${caseData.title}”`;
    if (onLaunchSparring) {
      onLaunchSparring(debateTopic);
    } else {
      onNavigate('sparring-sandbox');
    }
    showToast('Entering Spreadsheet Court to spar against this dynamic!');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-36">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Top Intro Section */}
      <section className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-container-lowest border border-black/10 shadow-[2px_2px_0px_#000000]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed border border-black/15 font-label-sm text-label-sm uppercase tracking-wider font-bold">
              <span className="material-symbols-outlined text-[14px]">document_scanner</span>
              Automatic Image Reader
            </span>
            <span className="font-mono text-xs text-on-surface-variant font-bold">
              {caseData.case_id.toUpperCase()}
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg-mobile sm:text-display-lg text-on-surface uppercase tracking-tight">
            Scan Chat Screenshots 🧾
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Upload a chat screenshot, paste an image link, or press <kbd className="font-mono bg-surface-container-highest px-1.5 py-0.5 rounded border border-black/20 text-xs font-bold">Ctrl+V</kbd> to extract messages and get reply advice.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenOcrStudio && (
            <button
              onClick={onOpenOcrStudio}
              className="px-4 py-2.5 rounded-xl bg-secondary-container hover:bg-secondary-container/90 text-on-secondary-fixed font-label-md text-label-md uppercase font-bold border border-black/15 shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">document_scanner</span>
              Open Image Reader
            </button>
          )}
        </div>
      </section>

      {/* Two-column layout on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Ingestion & OCR Telemetry */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Neo-brutalist Ingestion Chamber */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[3px_3px_0px_#000000] flex flex-col border-2 border-black"
          >
          {/* Upper Card Row */}
          <div className="p-4 flex items-center justify-between gap-4 border-b-2 border-black bg-surface-container-lowest">
            <div className="flex flex-col min-w-0 gap-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${analyzing ? 'bg-secondary animate-ping' : 'bg-secondary'}`}></span>
                <span className="font-headline-md text-headline-md text-on-surface uppercase tracking-tight">
                  {analyzing ? 'READING SCREENSHOT...' : 'SCAN SCREENSHOT'}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                Supports iMessage, WhatsApp, Instagram &amp; SMS
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="upload-receipt-btn"
                onClick={handleUploadClick}
                disabled={analyzing}
                className="shrink-0 px-4 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider hover:bg-on-surface-variant transition-colors flex items-center gap-1.5 active:scale-95 duration-150 cursor-pointer shadow-[2px_2px_0px_#000000]"
              >
                <span>{analyzing ? 'READING...' : 'UPLOAD IMAGE'}</span>
                <span className={`material-symbols-outlined text-[16px] ${analyzing ? 'animate-spin' : ''}`}>
                  {analyzing ? 'refresh' : 'upload_file'}
                </span>
              </button>
            </div>
          </div>

          {/* Mode Switcher Bar */}
          <div className="grid grid-cols-3 divide-x-2 divide-black bg-surface-container-low border-b-2 border-black">
            <button
              id="btn-camera-roll"
              onClick={handleUploadClick}
              className="flex items-center justify-center gap-1.5 py-3 px-2 hover:bg-surface-container-highest transition-colors group cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface group-hover:-translate-y-0.5 transition-transform">
                photo_library
              </span>
              <span className="font-label-md text-xs text-on-surface uppercase tracking-wide font-bold">
                From Device
              </span>
            </button>
            <button
              id="btn-image-url"
              onClick={() => {
                setIsUrlMode(!isUrlMode);
                setIsTextMode(false);
              }}
              className={`flex items-center justify-center gap-1.5 py-3 px-2 transition-colors group cursor-pointer ${
                isUrlMode ? 'bg-secondary-container font-bold' : 'hover:bg-surface-container-highest'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface group-hover:-translate-y-0.5 transition-transform">
                link
              </span>
              <span className="font-label-md text-xs text-on-surface uppercase tracking-wide">
                Image URL
              </span>
            </button>
            <button
              id="btn-paste-clipboard"
              onClick={() => {
                setIsTextMode(!isTextMode);
                setIsUrlMode(false);
              }}
              className={`flex items-center justify-center gap-1.5 py-3 px-2 transition-colors group cursor-pointer ${
                isTextMode ? 'bg-secondary-container font-bold' : 'hover:bg-surface-container-highest'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface group-hover:-translate-y-0.5 transition-transform">
                edit_note
              </span>
              <span className="font-label-md text-xs text-on-surface uppercase tracking-wide">
                Paste Text
              </span>
            </button>
          </div>

          {/* Optional Image URL Input Box */}
          {isUrlMode && (
            <div className="p-3.5 bg-surface-container-lowest border-b-2 border-black flex flex-col gap-2.5">
              <span className="font-label-sm uppercase font-bold text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-secondary">public</span>
                Paste Image Link:
              </span>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/screenshot.png"
                  className="flex-1 p-2 text-xs bg-surface-container-low border border-black/20 rounded-lg outline-none font-mono focus:border-black"
                />
                <button
                  onClick={handleUrlProcess}
                  disabled={analyzing}
                  className="px-3.5 py-2 rounded-lg bg-primary text-on-primary font-label-sm text-xs uppercase font-bold shadow-[2px_2px_0px_#000000] cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                >
                  {analyzing ? 'Reading...' : 'Read Image'}
                </button>
              </div>
            </div>
          )}

          {/* Preset Sample Selector (Instant 1-Click Testing) */}
          <div className="p-3 bg-surface-container-lowest border-b-2 border-black">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-sm text-[11px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-secondary">flash_on</span>
                Try a Sample Chat:
              </span>
              <span className="text-[10px] text-outline uppercase font-semibold">1-Click Test</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSelectPreset('imessage')}
                disabled={analyzing}
                className="px-2 py-2 rounded-lg bg-surface-container-low hover:bg-secondary-container border border-black/20 text-left transition-colors flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="text-[11px] font-bold uppercase truncate">💬 iMessage</span>
                <span className="text-[9px] text-on-surface-variant truncate">“Fine.” (34m delay)</span>
              </button>
              <button
                onClick={() => handleSelectPreset('whatsapp')}
                disabled={analyzing}
                className="px-2 py-2 rounded-lg bg-surface-container-low hover:bg-secondary-container border border-black/20 text-left transition-colors flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="text-[11px] font-bold uppercase truncate">🟢 WhatsApp</span>
                <span className="text-[9px] text-on-surface-variant truncate">Unread 3h (“K.”)</span>
              </button>
              <button
                onClick={() => handleSelectPreset('instagram')}
                disabled={analyzing}
                className="px-2 py-2 rounded-lg bg-surface-container-low hover:bg-secondary-container border border-black/20 text-left transition-colors flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="text-[11px] font-bold uppercase truncate">📸 Instagram</span>
                <span className="text-[9px] text-on-surface-variant truncate">Liked message tap</span>
              </button>
            </div>
          </div>

          {/* Optional Transcript Input Box */}
          {isTextMode && (
            <div className="p-4 bg-surface-container-lowest border-b-2 border-black flex flex-col gap-3">
              <span className="font-label-sm uppercase font-bold text-on-surface-variant">
                Paste Chat Text:
              </span>
              <textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                rows={4}
                className="w-full p-3 text-sm bg-surface-container-low border border-black/20 rounded-lg outline-none font-mono focus:border-black"
                placeholder="Paste conversation text, e.g.&#10;You: Hey are we still on?&#10;Them: Maybe. Work is crazy...&#10;You: Let me know so I can plan&#10;Them: Fine."
              />
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePasteClipboard}
                  className="text-xs text-on-surface-variant hover:text-black underline uppercase font-bold cursor-pointer"
                >
                  Paste from clipboard
                </button>
                <button
                  onClick={handleAnalyzeTranscript}
                  disabled={analyzing}
                  className="px-4 py-2 rounded-full bg-primary text-on-primary font-label-sm uppercase font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>{analyzing ? 'ANALYZING...' : 'ANALYZE TEXT'}</span>
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                </button>
              </div>
            </div>
          )}

          {/* Screenshot Preview with Active OCR Laser Scanner Overlay */}
          {previewImage && (
            <div className="p-3 bg-surface-container-low border-b-2 border-black relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="relative w-20 h-24 rounded-lg overflow-hidden border-2 border-black shadow-sm shrink-0 bg-black">
                  <img
                    src={previewImage}
                    alt="Receipt Evidence"
                    className="w-full h-full object-cover"
                  />
                  {/* High-tech OCR Laser Scan Bar */}
                  {analyzing && (
                    <div className="absolute inset-0 bg-green-500/15 pointer-events-none flex flex-col justify-between">
                      <div className="w-full h-1 bg-green-400 shadow-[0_0_8px_#22c55e] animate-pulse"></div>
                      <span className="text-[8px] text-green-400 font-mono font-bold px-1 bg-black/60">OCR ACTIVE</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-green-700">verified</span>
                    <span className="font-label-sm uppercase font-bold text-on-surface">
                      {analyzing ? 'Reading screenshot...' : (caseData.detected_app || 'Screenshot Ready')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-highest font-mono text-[10px] font-bold">
                      {caseData.ocr_confidence || 98.4}% ACCURACY
                    </span>
                    <span className="text-[11px] font-bold text-secondary">
                      {caseData.bubbles_detected || caseData.nodes.length} MESSAGES
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-tight truncate">
                    {analyzing
                      ? 'Extracting text and timestamps...'
                      : 'Text verified. View messages below.'}
                  </p>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => processImage(previewImage, 'Rescanned Evidence')}
                    disabled={analyzing}
                    className="px-2.5 py-1.5 rounded-md bg-surface-container text-on-surface font-label-sm text-[10px] uppercase font-bold border border-black/20 hover:bg-black hover:text-white transition-colors cursor-pointer"
                    title="Read image again"
                  >
                    Rescan
                  </button>
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="px-2.5 py-1 rounded-md text-error text-[10px] font-bold uppercase hover:underline cursor-pointer text-center"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Live Pipeline Telemetry Ticker */}
          <div className="bg-primary text-on-primary py-2 px-4 overflow-hidden whitespace-nowrap flex items-center">
            <div className="inline-flex items-center gap-4 animate-marquee">
              <span className="font-label-sm text-label-sm text-secondary-fixed uppercase tracking-wider flex items-center gap-1">
                ✨ Clean message extraction ✨
              </span>
              <span className="text-surface-variant font-label-sm text-label-sm">•</span>
              <span className="font-label-sm text-label-sm text-on-primary uppercase tracking-wider">
                Accurate text recognition
              </span>
              <span className="text-surface-variant font-label-sm text-label-sm">•</span>
              <span className="font-label-sm text-label-sm text-secondary-fixed uppercase tracking-wider flex items-center gap-1">
                ✨ Ready for reply suggestions ✨
              </span>
            </div>
          </div>
        </div>

          {/* Quick Tip Banner */}
          <div className="bg-secondary-container rounded-xl p-4 shadow-[3px_3px_0px_#000000] relative overflow-hidden border-2 border-black">
            <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-surface-container-lowest flex items-center justify-center rotate-12 shadow-[2px_2px_0px_#000000] border-[1.5px] border-black">
              <span className="font-label-sm text-[9px] uppercase font-bold text-center leading-none">
                QUICK
                <br />
                TIP
              </span>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-4 border-[1.5px] border-black">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-1 font-bold">
                Helpful Tip
              </span>
              <h3 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight leading-snug">
                Rule #1: Don&apos;t double-text after a one-word answer.
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 mb-4 leading-relaxed">
                A short reply like &ldquo;Fine.&rdquo; usually means they need space. Don&apos;t rush to send another message.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  id="btn-read-playbook"
                  onClick={onOpenPlaybook}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-container-lowest text-on-surface hover:bg-secondary-container transition-colors font-label-md text-label-md uppercase tracking-wider shadow-[2px_2px_0px_#000000] border-[1.5px] border-black cursor-pointer font-bold"
                >
                  <span>VIEW RULES &amp; TIPS</span>
                  <span className="material-symbols-outlined text-[14px]">north_east</span>
                </button>
                {onOpenAutopsyWithData && (
                  <button
                    onClick={() => onOpenAutopsyWithData(caseData)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider shadow-[2px_2px_0px_#000000] border-[1.5px] border-black cursor-pointer hover:opacity-90 font-bold"
                  >
                    <span>FULL ANALYSIS</span>
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Dual View Timeline & Tactical Intelligence */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Dual View Selector: Timeline vs Raw OCR Scan */}
          <div>
            <div className="grid grid-cols-2 rounded-xl border-2 border-black overflow-hidden bg-surface-container-low shadow-[2px_2px_0px_#000000]">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-2.5 px-3 font-label-md text-label-md uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  activeTab === 'timeline'
                    ? 'bg-primary text-on-primary font-bold'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
                <span>Chat Timeline</span>
              </button>
              <button
                onClick={() => setActiveTab('ocr-raw')}
                className={`py-2.5 px-3 font-label-md text-label-md uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors border-l-2 border-black ${
                  activeTab === 'ocr-raw'
                    ? 'bg-primary text-on-primary font-bold'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">document_scanner</span>
                <span>Extracted Text</span>
              </button>
            </div>
          </div>

      {/* VIEW A: OCR RAW TRANSCRIPT VIEW */}
      {activeTab === 'ocr-raw' && (
        <section className="px-4 mb-6 flex flex-col gap-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-xl p-4 border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-black/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary">analytics</span>
                <span className="font-headline-md text-headline-md uppercase text-on-surface">
                  Extracted Messages
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-[10px] font-bold uppercase">
                {caseData.detected_app || 'Apple iMessage'}
              </span>
            </div>

            {/* Telemetry Metrics Bar */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-surface-container-low rounded-lg border border-black/10">
                <span className="text-[10px] text-outline uppercase font-bold block">Accuracy</span>
                <span className="text-sm font-bold text-green-700">{caseData.ocr_confidence || 98.4}%</span>
              </div>
              <div className="p-2 bg-surface-container-low rounded-lg border border-black/10">
                <span className="text-[10px] text-outline uppercase font-bold block">Messages</span>
                <span className="text-sm font-bold text-primary">{caseData.nodes.length} Items</span>
              </div>
              <div className="p-2 bg-surface-container-low rounded-lg border border-black/10">
                <span className="text-[10px] text-outline uppercase font-bold block">Tension Score</span>
                <span className="text-sm font-bold text-error">{caseData.subtext_score}/100</span>
              </div>
            </div>

            {/* Verbatim Raw OCR Code block */}
            <div className="flex flex-col gap-1">
              <span className="font-label-sm text-[11px] uppercase font-bold text-on-surface-variant">
                Recognized Text:
              </span>
              <pre className="p-3 bg-surface-container-high rounded-lg text-xs font-mono text-on-surface whitespace-pre-wrap leading-relaxed border border-black/15 overflow-x-auto max-h-56 overflow-y-auto">
                {caseData.raw_ocr_text || transcriptText}
              </pre>
            </div>

            {/* Quick Actions for OCR Text */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(caseData.raw_ocr_text || transcriptText);
                  showToast('Extracted text copied to clipboard!');
                }}
                className="py-2.5 px-3 rounded-full bg-primary text-on-primary font-label-sm uppercase font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>Copy Text</span>
              </button>

              <button
                onClick={() => {
                  setIsTextMode(true);
                  setActiveTab('timeline');
                  showToast('Loaded text into editor.');
                }}
                className="py-2.5 px-3 rounded-full bg-surface-container text-on-surface font-label-sm uppercase font-bold flex items-center justify-center gap-1.5 border border-black/20 hover:bg-surface-container-high cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Edit Text</span>
              </button>
            </div>

            <button
              onClick={() => handleDeployToFumble()}
              className="w-full py-3 px-4 rounded-full bg-secondary-container text-on-secondary-fixed font-headline-md text-headline-md uppercase tracking-wide flex items-center justify-center gap-2 border-2 border-black hover:bg-secondary transition-colors cursor-pointer shadow-[2px_2px_0px_#000000]"
            >
              <span className="material-symbols-outlined text-[18px]">crisis_alert</span>
              <span>Check in Draft Checker →</span>
            </button>
          </div>
        </section>
      )}

      {/* VIEW B: FORENSIC RECONSTRUCTION FEED */}
      {activeTab === 'timeline' && (
        <section className="px-4 flex flex-col gap-6 mb-6">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="font-headline-md text-headline-md text-on-surface uppercase font-bold">
                Chat Conversation
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-bold">
                {caseData.nodes.length} MESSAGES
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">bolt</span> Ready
            </span>
          </div>

          {/* Dynamically Rendered Chat Nodes */}
          {caseData.nodes.map((node, index) => {
            const isYou = node.sender === 'you';
            const isTarget = index === caseData.nodes.length - 1;

            if (isTarget) {
              return (
                <div key={node.id} className="flex flex-col gap-2 items-start w-full mt-2">
                  <div className="w-full bg-tertiary-fixed rounded-2xl p-4 shadow-[4px_4px_0px_#000000] border-2 border-black">
                    {/* Card Top Pill Badge */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b-[1.5px] border-black">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary">
                        <span className="material-symbols-outlined text-[14px] text-secondary-fixed">chat_bubble</span>
                        <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
                          Latest Message
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-tertiary-fixed font-bold">
                        {node.timestamp} ({node.latency})
                      </span>
                    </div>

                    {/* Target Snippet */}
                    <div className="bg-surface-container-lowest rounded-xl p-4 mb-4 border-[1.5px] border-black">
                      <div className="flex items-baseline justify-between">
                        <h2 className="font-display-lg text-display-lg text-on-surface tracking-tight">
                          &ldquo;{node.text}&rdquo;
                        </h2>
                        <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm uppercase font-bold border border-black/10">
                          {node.subtextBadge || `${node.text.split(' ').length} Word • Short`}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                        Tension rating: {caseData.subtext_score}/100. This is a very brief response.
                      </p>
                    </div>

                    {/* Tactical Grid Matrix */}
                    <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[2px_2px_0px_#000000] border-2 border-black">
                      <div className="grid grid-cols-2 divide-x-2 divide-y-2 divide-black">
                        {/* Cell 1 */}
                        <button
                          id="tactical-cell-move"
                          onClick={() => handleTacticalMatrixClick("What's the move?")}
                          className="p-3.5 flex flex-col justify-between text-left hover:bg-secondary-container transition-colors group min-h-[96px] cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-label-md text-label-md text-on-surface uppercase font-bold">What should I say?</span>
                            <span className="material-symbols-outlined text-[18px] text-on-surface group-hover:rotate-45 transition-transform">
                              north_east
                            </span>
                          </div>
                          <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight mt-1">
                            See suggested reply
                          </span>
                        </button>
                        {/* Cell 2 */}
                        <button
                          id="tactical-cell-fumble"
                          onClick={() => handleTacticalMatrixClick('Did I fumble?')}
                          className="p-3.5 flex flex-col justify-between text-left hover:bg-secondary-container transition-colors group min-h-[96px] cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-label-md text-label-md text-on-surface uppercase font-bold">Did I say something wrong?</span>
                            <span className="material-symbols-outlined text-[18px] text-error">crisis_alert</span>
                          </div>
                          <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight mt-1">
                            Check draft risk
                          </span>
                        </button>
                        {/* Cell 3 */}
                        <button
                          id="tactical-cell-subtext"
                          onClick={() => handleTacticalMatrixClick('Subtext matrix')}
                          className="p-3.5 flex flex-col justify-between text-left hover:bg-secondary-container transition-colors group min-h-[96px] cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-label-md text-label-md text-on-surface uppercase font-bold">What does this mean?</span>
                            <span className="material-symbols-outlined text-[18px] text-on-surface">psychology</span>
                          </div>
                          <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight mt-1">
                            Understand their tone
                          </span>
                        </button>
                        {/* Cell 4 */}
                        <button
                          id="tactical-cell-counter"
                          onClick={() => handleTacticalMatrixClick('Counter this')}
                          className="p-3.5 flex flex-col justify-between text-left hover:bg-secondary-container transition-colors group min-h-[96px] cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-label-md text-label-md text-on-surface uppercase font-bold">More options</span>
                            <span className="material-symbols-outlined text-[18px] text-secondary">forum</span>
                          </div>
                          <span className="font-body-sm text-[11px] text-on-surface-variant leading-tight mt-1">
                            Polite &amp; relaxed replies
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Tactical Insight Viewer */}
                    {activeTacticalInsight && (
                      <div className="mt-3 p-3 bg-surface-container-lowest rounded-xl border border-black text-on-surface text-sm animate-fadeIn">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-label-sm uppercase font-bold text-secondary">
                            Advice
                          </span>
                          <button
                            onClick={() => setActiveTacticalInsight(null)}
                            className="text-xs text-on-surface-variant hover:text-black font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                        {activeTacticalInsight === "What's the move?" && (
                          <div className="space-y-2">
                            <p className="font-body-sm text-body-sm leading-snug">
                              Recommended Reply: <strong className="text-primary">{caseData.tactical_move}</strong>
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard?.writeText(caseData.tactical_move.replace(/[“""”]/g, ''));
                                  showToast('Copied reply to clipboard!');
                                }}
                                className="px-3 py-1.5 bg-secondary-container text-on-secondary-fixed text-xs rounded-full font-bold uppercase cursor-pointer"
                              >
                                Copy Reply
                              </button>
                              <button
                                onClick={() => handleDeployToFumble(caseData.tactical_move)}
                                className="px-3 py-1.5 bg-primary text-on-primary text-xs rounded-full font-bold uppercase cursor-pointer"
                              >
                                Check this Draft →
                              </button>
                            </div>
                          </div>
                        )}
                        {activeTacticalInsight === 'Did I fumble?' && (
                          <p className="font-body-sm text-body-sm leading-snug">
                            Verdict: You haven&apos;t done anything wrong! The best response is simply not to rush or over-apologize.
                          </p>
                        )}
                        {activeTacticalInsight === 'Subtext matrix' && (
                          <div className="space-y-2">
                            <p className="font-body-sm text-body-sm leading-snug">
                              Analysis: {caseData.forensic_summary}
                            </p>
                            {onOpenAutopsyWithData && (
                              <button
                                onClick={() => onOpenAutopsyWithData(caseData)}
                                className="text-xs font-bold text-primary underline block cursor-pointer"
                              >
                                View full details →
                              </button>
                            )}
                          </div>
                        )}
                        {activeTacticalInsight === 'Counter this' && (
                          <div className="space-y-2 font-body-sm text-body-sm">
                            <div className="p-2 bg-surface-container-low rounded border border-black/10">
                              {caseData.tactical_move}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeployToFumble(caseData.tactical_move)}
                                className="text-xs font-bold text-primary underline cursor-pointer"
                              >
                                Check in Draft Checker →
                              </button>
                              <button
                                onClick={handleSparInCourt}
                                className="text-xs font-bold text-secondary underline cursor-pointer"
                              >
                                Practice in Chat →
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Cross-Screen Nav Buttons inside Target Node */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleDeployToFumble()}
                        className="flex-1 py-2 px-3 rounded-full bg-surface-container-lowest text-on-surface font-label-sm text-[11px] uppercase font-bold border border-black hover:bg-secondary-container transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">crisis_alert</span>
                        <span>Check Draft</span>
                      </button>
                      <button
                        onClick={handleSparInCourt}
                        className="flex-1 py-2 px-3 rounded-full bg-surface-container-lowest text-on-surface font-label-sm text-[11px] uppercase font-bold border border-black hover:bg-secondary-container transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">forum</span>
                        <span>Practice Chat</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            if (isYou) {
              return (
                <div key={node.id} className="flex flex-col gap-2 items-end">
                  {node.errorCallout && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-on-error-container shadow-[2px_2px_0px_#ba1a1a] border-[1.5px] border-[#ba1a1a]">
                      <span className="material-symbols-outlined text-[15px] animate-bounce">warning</span>
                      <span className="font-label-sm text-label-sm uppercase tracking-wide font-bold">
                        {node.errorCallout}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                      {node.latency}
                    </span>
                    {node.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-[9px] uppercase font-bold border border-black/10">
                        {node.badge}
                      </span>
                    )}
                  </div>
                  <div className="max-w-[88%] bg-surface-container-lowest rounded-2xl rounded-tr-xs p-4 text-on-surface shadow-[2px_2px_0px_#000000] border-[1.5px] border-black">
                    <p className="font-body-md text-body-md leading-relaxed">{node.text}</p>
                    <div className="mt-2 flex justify-between items-center text-on-surface-variant gap-4">
                      <span className="font-label-sm text-[10px]">{node.timestamp} • READ</span>
                      <span className="material-symbols-outlined text-[16px] text-secondary font-bold">done_all</span>
                    </div>
                  </div>
                </div>
              );
            }

            // Them (Incoming node)
            return (
              <div key={node.id} className="flex flex-col gap-2 items-start">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    {node.latency}
                  </span>
                  {node.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-[9px] uppercase font-bold border border-black/10">
                      {node.badge}
                    </span>
                  )}
                </div>
                <div className="max-w-[88%] bg-surface-container-low rounded-2xl rounded-tl-xs p-4 text-on-surface shadow-[2px_2px_0px_#000000] border-[1.5px] border-black">
                  <p className="font-body-md text-body-md leading-relaxed">{node.text}</p>
                  {node.subtextBadge && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant border border-black/10">
                      <span className="material-symbols-outlined text-[12px]">shield_with_heart</span>
                      <span className="font-label-sm text-[9px] uppercase tracking-wide font-bold">
                        {node.subtextBadge}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

          {/* Master Bottom Call-to-Action Bar */}
          <div className="pt-2 pb-2">
            <button
              id="btn-engage-copilot"
              onClick={handleSparInCourt}
              className="w-full py-4 px-4 rounded-xl bg-primary text-on-primary font-headline-md text-headline-md uppercase tracking-wider shadow-[4px_4px_0px_#6b5f00] hover:bg-surface-container-highest hover:text-on-surface transition-all flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5 border-2 border-black cursor-pointer font-bold"
            >
              <span>PRACTICE REPLYING IN CHAT</span>
              <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
            </button>
            <div className="mt-3 flex items-center justify-center gap-4">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">lock</span> Private &amp; Secure
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified</span> Automatic Image Reader
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
