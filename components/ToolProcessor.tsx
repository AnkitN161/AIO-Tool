
import React, { useState, useCallback, useEffect } from 'react';
import { Upload, File as FileIcon, X, CheckCircle, ArrowRight, Download, Loader2, RefreshCw, AlertCircle, Copy, Settings, Sliders, HardDrive, Server, Terminal, AlertTriangle, Activity, Globe, Film, Music, ArrowDown, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Textarea, Input, Select } from './UIComponents';
import { Tool } from '../types';
import { processTool, ProcessResult } from '../services/processors';

interface ToolProcessorProps {
  tool: Tool;
}

type ProcessStatus = 'idle' | 'processing' | 'completed' | 'error';

const OFFICE_TOOLS = ['word-to-pdf', 'excel-to-pdf', 'ppt-to-pdf', 'pdf-to-word', 'pdf-to-excel', 'pdf-to-ppt'];

// Helper constants for generating setup files
const DOCKERFILE_CONTENT = `FROM node:18-slim

# Install LibreOffice for file conversion
RUN apt-get update && apt-get install -y libreoffice \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json .
RUN npm install

COPY server.js .

EXPOSE 3001
CMD ["node", "server.js"]`;

const SERVER_JS_CONTENT = `const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
// Enable CORS for all origins (required for browser access)
app.use(cors());

const upload = multer({ dest: 'uploads/' });

// Health check route for the Setup Guide
app.get('/', (req, res) => {
  res.send('AIO Server is Running!');
});

app.post('/convert', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const inputPath = req.file.path;
  const outputDir = 'outputs';
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  // Command to convert using LibreOffice
  // --headless: run without GUI
  // --convert-to pdf: target format
  // --outdir: where to save
  const cmd = \`libreoffice --headless --convert-to pdf "\${inputPath}" --outdir \${outputDir}\`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('Conversion error:', error);
      return res.status(500).send('Conversion failed.');
    }

    // Find the generated PDF file (name is same as input but .pdf)
    const filename = path.parse(req.file.originalname).name + '.pdf';
    const outputPath = path.join(outputDir, path.parse(req.file.filename).name + '.pdf');

    if (fs.existsSync(outputPath)) {
      res.download(outputPath, filename, () => {
        // Cleanup files after sending
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    } else {
      res.status(500).send('Output file not found.');
    }
  });
});

app.listen(3001, () => console.log('Server running on port 3001'));`;

const PACKAGE_JSON_CONTENT = `{
  "name": "aio-server",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5"
  }
}`;

// Utility to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const ToolProcessor = ({ tool }: ToolProcessorProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState('');
  const [status, setStatus] = useState<ProcessStatus>('idle');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSetup, setShowSetup] = useState(false);

  // Server URL (persisted in localStorage)
  const [serverUrl, setServerUrl] = useState(() => {
     if (typeof window !== 'undefined') {
         return localStorage.getItem('aio_server_url') || 'http://localhost:3001';
     }
     return 'http://localhost:3001';
  });

  // Compression Settings (Image)
  const [compressMode, setCompressMode] = useState<'quality' | 'size'>('quality');
  const [quality, setQuality] = useState(80);
  const [targetSize, setTargetSize] = useState(500); // KB

  // Compression Settings (Video)
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high'>('medium');

  // Compression Settings (Audio)
  const [audioBitrate, setAudioBitrate] = useState<string>('128k');

  const isTextInputTool = tool.id === 'qr-generator';
  const isHybridTool = ['base64-encoder', 'json-to-csv', 'text-to-pdf', 'markdown-to-html'].includes(tool.id);
  const isOfficeTool = OFFICE_TOOLS.includes(tool.id);

  // Defines which tools support multiple file uploads
  const supportsBatch = 
    tool.id.includes('merge') || 
    tool.id === 'image-to-pdf' || 
    tool.id === 'image-compressor' ||
    ['jpg-to-png', 'png-to-jpg', 'webp-to-jpg', 'image-resizer', 'svg-to-png'].includes(tool.id);

  // Helper to determine accepted file types
  const getAcceptAttribute = () => {
    const { id, categoryId } = tool;
    
    if (id === 'merge-pdf' || id === 'split-pdf' || id === 'ocr-pdf' || (id.startsWith('pdf-to-') && id !== 'pdf-to-word')) return '.pdf,application/pdf';
    if (id === 'word-to-pdf') return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (id === 'excel-to-pdf') return '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (id === 'ppt-to-pdf') return '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
    if (id === 'image-to-pdf') return 'image/*,.jpg,.jpeg,.png';
    if (id === 'text-to-pdf') return '.txt,text/plain';
    if (id === 'html-to-pdf') return '.html,.htm,text/html';
    
    if (categoryId === 'images') return 'image/*';
    if (categoryId === 'video') return 'video/*';
    if (categoryId === 'audio') return 'audio/*';
    if (categoryId === 'archives') return '.zip,.rar,.7z,application/zip,application/x-zip-compressed';
    
    return undefined;
  };

  // Update local storage when serverUrl changes
  useEffect(() => {
    localStorage.setItem('aio_server_url', serverUrl);
  }, [serverUrl]);

  // Reset when tool changes
  useEffect(() => {
    setFiles([]);
    setTextInput('');
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
    
    // Defaults
    setQuality(80);
    setTargetSize(500);
    setCompressMode('quality');
    setVideoQuality('medium');
    setAudioBitrate('128k');
    
    setShowSetup(false);
  }, [tool.id]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => supportsBatch ? [...prev, ...newFiles] : newFiles);
    }
  }, [supportsBatch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => supportsBatch ? [...prev, ...newFiles] : newFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startConversion = async () => {
    if (!isTextInputTool && files.length === 0 && !textInput) return;
    
    setStatus('processing');
    setErrorMsg('');
    
    try {
      const options = {
        compressMode,
        quality: quality / 100,
        targetSizeKB: targetSize,
        videoQuality,
        audioBitrate,
        serverUrl // PASS THE CONFIGURED URL
      };

      const res = await processTool(tool.id, files, textInput, options);
      if (res.success) {
        setResult(res);
        setStatus('completed');
      } else {
        throw new Error(res.message || 'Processing failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const reset = () => {
    setFiles([]);
    setTextInput('');
    setStatus('idle');
    setResult(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    const btn = document.activeElement as HTMLButtonElement;
    if(btn) {
      const original = btn.innerHTML;
      btn.innerText = 'Copied!';
      setTimeout(() => btn.innerHTML = original, 2000);
    }
  };

  const renderSettings = () => {
    // Image Compressor Settings
    if (tool.id === 'image-compressor' && files.length > 0) {
      return (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings size={16} className="text-primary-600" />
            <span className="font-medium text-sm">Compression Settings</span>
          </div>
          
          <div className="flex gap-2 mb-4 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 inline-flex">
            <button 
              onClick={() => setCompressMode('quality')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${compressMode === 'quality' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Sliders size={14} /> By Quality
            </button>
            <button 
              onClick={() => setCompressMode('size')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${compressMode === 'size' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <HardDrive size={14} /> By Target Size
            </button>
          </div>

          {compressMode === 'quality' ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Better Compression</span>
                <span>Better Quality</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={quality} 
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600 dark:bg-slate-700"
              />
              <div className="text-center text-sm font-bold text-primary-600">{quality}% Quality</div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Max File Size per Image (KB)</label>
              <div className="flex items-center gap-2">
                <Input 
                  value={targetSize.toString()}
                  onChange={(e) => setTargetSize(Number(e.target.value))}
                  placeholder="e.g. 500"
                  className="h-9"
                />
                <span className="text-sm font-medium text-slate-500">KB</span>
              </div>
            </div>
          )}
        </motion.div>
      );
    }

    // Video Compressor Settings
    if (tool.id === 'video-compressor' && files.length > 0) {
      return (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-4">
            <Film size={16} className="text-primary-600" />
            <span className="font-medium text-sm">Compression Level</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
             {(['low', 'medium', 'high'] as const).map((level) => (
               <button
                 key={level}
                 onClick={() => setVideoQuality(level)}
                 className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                   videoQuality === level 
                    ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-300'
                 }`}
               >
                 <div className="capitalize">{level}</div>
                 <div className="text-[10px] opacity-75 font-normal">
                   {level === 'low' ? 'Smallest Size' : level === 'high' ? 'Best Quality' : 'Balanced'}
                 </div>
               </button>
             ))}
          </div>
        </motion.div>
      );
    }

    // Audio Compressor Settings
    if (tool.id === 'audio-compressor' && files.length > 0) {
       return (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-4">
            <Music size={16} className="text-primary-600" />
            <span className="font-medium text-sm">Audio Bitrate</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
             {['64k', '128k', '192k', '320k'].map((bitrate) => (
               <button
                 key={bitrate}
                 onClick={() => setAudioBitrate(bitrate)}
                 className={`px-2 py-2 text-sm font-medium rounded-lg border transition-all ${
                   audioBitrate === bitrate
                    ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-300'
                 }`}
               >
                 {bitrate}
               </button>
             ))}
          </div>
        </motion.div>
       )
    }

    return null;
  };

  const renderInputSection = () => {
    if (isTextInputTool) {
      return (
        <div className="w-full max-w-lg mx-auto space-y-4">
          <Input 
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter text or URL to generate QR Code..."
            className="h-12 text-lg"
          />
          <Button onClick={startConversion} fullWidth disabled={!textInput} className="h-12 text-lg">
             Generate QR Code <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col items-center">
         {files.length === 0 ? (
          <motion.div 
            className={`w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer relative overflow-hidden ${dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="p-4 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 mb-4 pointer-events-none">
              <Upload size={32} />
            </div>
            <p className="text-lg font-medium mb-1 pointer-events-none">Drag & Drop files here</p>
            <p className="text-sm text-slate-500 mb-6 pointer-events-none">or click to browse</p>
            <input 
              id="file-upload" 
              type="file" 
              className="hidden" 
              multiple={supportsBatch} 
              accept={getAcceptAttribute()}
              onChange={handleFileChange} 
            />
            <Button variant="outline" onClick={(e) => { e.stopPropagation(); document.getElementById('file-upload')?.click(); }}>Select Files</Button>
            
            {isHybridTool && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 w-full max-w-xs text-center" onClick={e => e.stopPropagation()}>
                 <p className="text-xs text-slate-400 mb-2">Or enter text directly</p>
                 <Textarea 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type or paste content..."
                    className="min-h-[80px]"
                 />
                 <Button size="sm" className="absolute bottom-2 right-2" onClick={startConversion}>Generate</Button>
              </div>
            )}
          </motion.div>
         ) : (
           <div className="w-full space-y-4">
             <div className="flex justify-between items-center mb-2">
               <h3 className="font-medium text-slate-900 dark:text-slate-100">Selected Files ({files.length})</h3>
               <Button variant="ghost" size="sm" onClick={reset} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Clear All</Button>
             </div>
             <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
               {files.map((file, index) => (
                 <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                        <FileIcon size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate text-slate-700 dark:text-slate-200">{file.name}</div>
                        <div className="text-xs text-slate-500">{formatBytes(file.size)}</div>
                      </div>
                    </div>
                    <button onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500 p-2 transition-colors">
                      <X size={18} />
                    </button>
                 </div>
               ))}
             </div>
             {supportsBatch && (
                <div className="flex justify-center mt-4">
                   <Button variant="outline" size="sm" onClick={() => document.getElementById('add-more')?.click()}>
                      <Plus size={16} className="mr-2" /> Add More Files
                   </Button>
                   <input id="add-more" type="file" className="hidden" accept={getAcceptAttribute()} multiple onChange={handleFileChange} />
                </div>
             )}
           </div>
         )}
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    return (
       <div className="text-center py-6 space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircle size={32} />
          </motion.div>
          
          <div>
             <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Success!</h3>
             <p className="text-slate-500 dark:text-slate-400">Your file has been processed.</p>
          </div>

          {/* Show Stats if available */}
          {result.originalSize && result.newSize && (
             <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 max-w-sm mx-auto">
                <div className="text-sm font-medium text-slate-500 mb-2">Compression Results</div>
                <div className="flex items-center justify-center gap-4 text-lg font-bold">
                   <span className="text-slate-400 line-through text-base">{formatBytes(result.originalSize)}</span>
                   <ArrowRight size={16} className="text-slate-300" />
                   <span className="text-green-600">{formatBytes(result.newSize)}</span>
                </div>
                <div className="text-xs text-green-600 mt-1 font-semibold">
                   Saved {((1 - result.newSize / result.originalSize) * 100).toFixed(1)}%
                </div>
             </div>
          )}

          {result.type === 'text' && result.text ? (
            <div className="relative">
              <Textarea 
                value={result.text} 
                onChange={() => {}} 
                className="font-mono text-sm bg-slate-50 dark:bg-slate-900"
              />
              <Button 
                size="sm" 
                variant="secondary" 
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(result.text || '')}
              >
                <Copy size={14} className="mr-1" /> Copy
              </Button>
            </div>
          ) : result.type === 'image' && result.url ? (
             <div className="flex flex-col items-center">
                <img src={result.url} alt="Result" className="max-w-full h-auto max-h-64 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mb-4" />
                <a href={result.url} download={result.filename || 'download.png'} className="w-full max-w-xs">
                   <Button fullWidth className="h-12 text-lg">
                      <Download size={20} className="mr-2" /> Download Image
                   </Button>
                </a>
             </div>
          ) : result.url ? (
             <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center gap-3">
                   <FileIcon size={24} className="text-primary-600" />
                   <span className="font-medium">{result.filename || 'processed_file'}</span>
                </div>
                <a href={result.url} download={result.filename || 'download'} className="w-full max-w-xs">
                   <Button fullWidth className="h-12 text-lg">
                      <Download size={20} className="mr-2" /> Download File
                   </Button>
                </a>
             </div>
          ) : null}

          <Button variant="ghost" onClick={reset} className="mt-4">
             <RefreshCw size={16} className="mr-2" /> Process Another File
          </Button>
       </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
         <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-4">{tool.title}</h1>
         <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">{tool.description}</p>
      </div>

      <Card className="p-6 md:p-8">
        {status === 'idle' && (
          <div className="space-y-8">
             {renderInputSection()}
             {renderSettings()}
             
             {(files.length > 0 || textInput) && (
               <div className="flex justify-center mt-8">
                 <Button size="lg" onClick={startConversion} className="w-full md:w-auto min-w-[200px]">
                   Start Processing
                 </Button>
               </div>
             )}
          </div>
        )}

        {status === 'processing' && (
           <div className="py-20 text-center">
              <Loader2 size={48} className="animate-spin text-primary-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-2">Processing...</h3>
              <p className="text-slate-500">Please wait while we handle your files.</p>
           </div>
        )}

        {status === 'completed' && result && (
           renderResult()
        )}

        {status === 'error' && (
           <div className="py-10 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-red-600">Something went wrong</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">{errorMsg || "An unknown error occurred."}</p>
              <Button onClick={reset}>Try Again</Button>
           </div>
        )}
      </Card>
      
      {/* Server Setup Guide for Office Tools */}
      {isOfficeTool && (
         <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8">
            <div 
               className="flex items-center justify-between cursor-pointer p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors"
               onClick={() => setShowSetup(!showSetup)}
            >
               <div className="flex items-center gap-3">
                  <Server size={20} className="text-slate-500" />
                  <div>
                     <h3 className="font-medium">Self-Hosted Server Setup</h3>
                     <p className="text-xs text-slate-500">Required for Office to PDF conversions (Word, Excel, PPT)</p>
                  </div>
               </div>
               <ArrowDown size={20} className={`text-slate-400 transition-transform ${showSetup ? 'rotate-180' : ''}`} />
            </div>
            
            <AnimatePresence>
               {showSetup && (
                  <motion.div 
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: 'auto', opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="overflow-hidden"
                  >
                     <div className="mt-4 p-6 bg-slate-900 text-slate-300 rounded-xl font-mono text-sm overflow-x-auto">
                        <div className="space-y-6">
                           <div>
                              <div className="text-slate-100 font-bold mb-2 flex items-center gap-2"><Terminal size={16}/> Step 1: Create package.json</div>
                              <div className="relative group">
                                 <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800">{PACKAGE_JSON_CONTENT}</pre>
                                 <button onClick={() => copyToClipboard(PACKAGE_JSON_CONTENT)} className="absolute top-2 right-2 p-2 bg-slate-800 rounded hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={14}/></button>
                              </div>
                           </div>
                           
                           <div>
                              <div className="text-slate-100 font-bold mb-2 flex items-center gap-2"><Terminal size={16}/> Step 2: Create server.js</div>
                              <div className="relative group">
                                 <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800">{SERVER_JS_CONTENT}</pre>
                                 <button onClick={() => copyToClipboard(SERVER_JS_CONTENT)} className="absolute top-2 right-2 p-2 bg-slate-800 rounded hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={14}/></button>
                              </div>
                           </div>

                           <div>
                              <div className="text-slate-100 font-bold mb-2 flex items-center gap-2"><Terminal size={16}/> Step 3: Create Dockerfile</div>
                              <div className="relative group">
                                 <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800">{DOCKERFILE_CONTENT}</pre>
                                 <button onClick={() => copyToClipboard(DOCKERFILE_CONTENT)} className="absolute top-2 right-2 p-2 bg-slate-800 rounded hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={14}/></button>
                              </div>
                           </div>

                           <div>
                              <div className="text-slate-100 font-bold mb-2 flex items-center gap-2"><Activity size={16}/> Step 4: Run Container</div>
                              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                 docker build -t aio-server .<br/>
                                 docker run -p 3001:3001 aio-server
                              </div>
                           </div>

                           <div>
                              <div className="text-slate-100 font-bold mb-2 flex items-center gap-2"><Globe size={16}/> Step 5: Configure Client</div>
                              <p className="mb-2">Enter your server URL below (default is localhost:3001):</p>
                              <Input 
                                 value={serverUrl} 
                                 onChange={(e) => setServerUrl(e.target.value)} 
                                 className="max-w-md bg-slate-950 border-slate-700 text-white"
                              />
                           </div>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      )}
    </div>
  );
};
