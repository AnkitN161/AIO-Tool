
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

const OFFICE_TOOLS = ['word-to-pdf', 'excel-to-pdf', 'ppt-to-pdf', 'pdf-to-word', 'pdf-to-excel', 'pdf-to-ppt', 'pdf-to-text'];

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
  // Default to pdf if not specified
  const targetFormat = req.body.format || 'pdf'; 
  
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  // Command to convert using LibreOffice
  // --headless: run without GUI
  // --convert-to: target format (pdf, docx, xlsx, etc)
  // --outdir: where to save
  const cmd = \`libreoffice --headless --convert-to \${targetFormat} "\${inputPath}" --outdir \${outputDir}\`;

  console.log(\`Processing: \${req.file.originalname} -> .\${targetFormat}\`);

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('Conversion error:', error);
      return res.status(500).send('Conversion failed.');
    }

    // LibreOffice saves the file with the new extension in outputDir
    // Note: LibreOffice handles the naming, usually input filename + extension
    // We need to find the file properly.
    const originalNameNoExt = path.parse(req.file.originalname).name;
    const generatedNameNoExt = path.parse(req.file.filename).name;
    
    // Construct the expected output filename. 
    // LibreOffice uses the input filename for the output.
    // But since multer renames the input file to a hash (req.file.filename), 
    // LibreOffice will output [hash].[format]
    const outputPath = path.join(outputDir, generatedNameNoExt + '.' + targetFormat);
    const downloadName = originalNameNoExt + '.' + targetFormat;

    if (fs.existsSync(outputPath)) {
      res.download(outputPath, downloadName, () => {
        // Cleanup files after sending
        try {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        } catch(e) { console.error('Cleanup error', e); }
      });
    } else {
      console.error('Output file missing:', outputPath);
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
    
    if (id === 'merge-pdf' || id === 'split-pdf' || id === 'ocr-pdf' || id.startsWith('pdf-')) {
        return '.pdf';
    }
    if (categoryId === 'images') return 'image/*';
    if (categoryId === 'audio') return 'audio/*';
    if (categoryId === 'video') return 'video/*';
    if (categoryId === 'archives') return '.zip,.rar,.7z,.tar';
    if (id === 'word-to-pdf') return '.doc,.docx';
    if (id === 'excel-to-pdf') return '.xls,.xlsx';
    if (id === 'ppt-to-pdf') return '.ppt,.pptx';
    
    return '*/*';
  };

  // Drag handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, [supportsBatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    if (supportsBatch) {
      setFiles(prev => [...prev, ...newFiles]);
    } else {
      setFiles([newFiles[0]]);
    }
    setErrorMsg('');
    setResult(null);
    setStatus('idle');
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (!files.length && !textInput) {
       setErrorMsg("Please provide files or input text.");
       return;
    }

    setStatus('processing');
    setErrorMsg('');
    setResult(null);

    try {
      const options = {
         serverUrl,
         quality: quality / 100,
         targetSizeKB: targetSize,
         compressMode,
         videoQuality,
         audioBitrate
      };

      const res = await processTool(tool.id, files, textInput, options);
      
      if (res.success) {
        setResult(res);
        setStatus('completed');
      } else {
        setStatus('error');
        setErrorMsg(res.message || "Processing failed.");
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const reset = () => {
    setFiles([]);
    setTextInput('');
    setResult(null);
    setStatus('idle');
    setErrorMsg('');
  };

  // Setup Guide Download
  const downloadSetupFiles = () => {
    const zip = new (window as any).JSZip();
    // This assumes JSZip is loaded globally or we import it. 
    // But for safety in this snippet, we might need to import or assume presence.
    // Since `services/processors.ts` imports JSZip, we can probably import it here too, 
    // but to keep file simpler let's just show text instructions or use a simple data URI approach if possible,
    // OR better yet, just display the code blocks.
    // For this UI, we toggle the "showSetup" modal/card.
  };

  const saveServerUrl = (url: string) => {
     setServerUrl(url);
     localStorage.setItem('aio_server_url', url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* --- Setup Guide (for Office Tools) --- */}
      {isOfficeTool && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl overflow-hidden"
        >
          <div className="p-4 flex items-start gap-3">
             <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
             <div className="flex-1 text-sm text-amber-900 dark:text-amber-100">
                <p className="font-semibold mb-1">Local Server Required</p>
                <p className="mb-2">
                  This tool requires a local backend because browsers cannot natively convert Office files.
                  You need to run our lightweight Docker container.
                </p>
                <div className="flex gap-3 mt-2">
                   <button 
                     onClick={() => setShowSetup(!showSetup)} 
                     className="text-amber-700 underline font-medium hover:text-amber-900"
                   >
                     {showSetup ? "Hide Setup Guide" : "View Setup Guide"}
                   </button>
                </div>
             </div>
          </div>
          
          <AnimatePresence>
            {showSetup && (
              <motion.div 
                 initial={{ height: 0 }}
                 animate={{ height: 'auto' }}
                 exit={{ height: 0 }}
                 className="border-t border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-950 p-6 text-sm overflow-hidden"
              >
                 <div className="grid md:grid-cols-2 gap-6">
                    <div>
                       <h4 className="font-bold mb-2 flex items-center gap-2">1. Create Files</h4>
                       <p className="text-slate-500 mb-2">Create a folder and add these 3 files:</p>
                       
                       <div className="space-y-4">
                          <div>
                             <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Dockerfile</span> <Copy size={12} className="cursor-pointer hover:text-primary-500" onClick={() => navigator.clipboard.writeText(DOCKERFILE_CONTENT)}/></div>
                             <pre className="bg-slate-100 dark:bg-slate-900 p-2 rounded text-xs overflow-x-auto border border-slate-200 dark:border-slate-800">{DOCKERFILE_CONTENT}</pre>
                          </div>
                          <div>
                             <div className="flex justify-between text-xs text-slate-500 mb-1"><span>package.json</span> <Copy size={12} className="cursor-pointer hover:text-primary-500" onClick={() => navigator.clipboard.writeText(PACKAGE_JSON_CONTENT)}/></div>
                             <pre className="bg-slate-100 dark:bg-slate-900 p-2 rounded text-xs overflow-x-auto border border-slate-200 dark:border-slate-800">{PACKAGE_JSON_CONTENT}</pre>
                          </div>
                          <div>
                             <div className="flex justify-between text-xs text-slate-500 mb-1"><span>server.js</span> <Copy size={12} className="cursor-pointer hover:text-primary-500" onClick={() => navigator.clipboard.writeText(SERVER_JS_CONTENT)}/></div>
                             <pre className="bg-slate-100 dark:bg-slate-900 p-2 rounded text-xs overflow-x-auto border border-slate-200 dark:border-slate-800 h-32">{SERVER_JS_CONTENT}</pre>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div>
                          <h4 className="font-bold mb-2">2. Run with Docker</h4>
                          <pre className="bg-slate-900 text-slate-50 p-3 rounded-lg text-xs font-mono">
{`docker build -t aio-server .
docker run -p 3001:3001 aio-server`}
                          </pre>
                       </div>
                       <div>
                          <h4 className="font-bold mb-2">3. Configure URL</h4>
                          <p className="text-slate-500 mb-2">If running on a different port/host:</p>
                          <div className="flex gap-2">
                             <Input 
                                value={serverUrl} 
                                onChange={(e) => saveServerUrl(e.target.value)}
                                placeholder="http://localhost:3001"
                             />
                             <Button size="sm" onClick={() => alert('Saved!')}>Save</Button>
                          </div>
                       </div>
                       <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
                          <strong>Note:</strong> This server runs locally on your machine. No data is sent to us.
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* --- Input Area --- */}
      <Card className="p-6 md:p-10">
        {!result ? (
           <div className="space-y-8">
              {/* Text Input Mode */}
              {(isTextInputTool || (isHybridTool && files.length === 0)) && (
                 <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {isHybridTool ? 'Or enter text/content:' : 'Enter content:'}
                    </label>
                    <Textarea 
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type or paste content here..."
                      rows={6}
                    />
                 </div>
              )}

              {/* Hybrid Separator */}
              {isHybridTool && (
                 <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-950 px-2 text-slate-500">Or upload file</span>
                    </div>
                 </div>
              )}

              {/* File Upload Area */}
              {!isTextInputTool && (
                <div className="space-y-4">
                  <div 
                    className={`
                      relative border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all duration-200 ease-in-out
                      ${dragActive 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 scale-[0.99]' 
                        : 'border-slate-300 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={handleChange}
                      multiple={supportsBatch}
                      accept={getAcceptAttribute()}
                    />
                    
                    <div className="flex flex-col items-center pointer-events-none">
                       <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center mb-4">
                          <Upload size={32} />
                       </div>
                       <h3 className="text-lg font-semibold mb-2">
                          {files.length > 0 ? 'Add more files' : 'Drop files here or click to upload'}
                       </h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                          Support for {getAcceptAttribute().replace(/\./g, ' ').toUpperCase()}
                       </p>
                    </div>
                  </div>

                  {/* File List */}
                  <AnimatePresence>
                    {files.length > 0 && (
                       <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid gap-2"
                       >
                          {files.map((file, idx) => (
                             <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                   <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                      <FileIcon size={16} className="text-slate-500"/>
                                   </div>
                                   <div className="min-w-0">
                                      <p className="text-sm font-medium truncate">{file.name}</p>
                                      <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => removeFile(idx)}
                                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                   <X size={18} />
                                </button>
                             </div>
                          ))}
                       </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Settings Section */}
              {(tool.id === 'image-compressor' || tool.id === 'video-compressor' || tool.id === 'audio-compressor') && files.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Settings size={16} className="text-slate-500"/> Compression Settings
                  </h4>
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Image Settings */}
                    {tool.id === 'image-compressor' && (
                      <>
                        <div className="space-y-3">
                           <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Mode</label>
                           <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                              <button 
                                onClick={() => setCompressMode('quality')}
                                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${compressMode === 'quality' ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}
                              >
                                Quality %
                              </button>
                              <button 
                                onClick={() => setCompressMode('size')}
                                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${compressMode === 'size' ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}
                              >
                                Target Size
                              </button>
                           </div>
                        </div>
                        <div className="space-y-3">
                           {compressMode === 'quality' ? (
                             <>
                               <div className="flex justify-between text-sm">
                                  <span>Quality</span>
                                  <span className="font-mono">{quality}%</span>
                               </div>
                               <input 
                                 type="range" 
                                 min="10" 
                                 max="90" 
                                 value={quality} 
                                 onChange={(e) => setQuality(parseInt(e.target.value))}
                                 className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-800"
                               />
                             </>
                           ) : (
                             <>
                               <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Target Size (KB)</label>
                               <Input 
                                 value={targetSize.toString()} 
                                 onChange={(e) => setTargetSize(parseInt(e.target.value) || 0)}
                                 placeholder="e.g. 500"
                                 className="h-9"
                               />
                             </>
                           )}
                        </div>
                      </>
                    )}

                    {/* Video Settings */}
                    {tool.id === 'video-compressor' && (
                      <div className="space-y-3 sm:col-span-2">
                         <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Compression Level</label>
                         <div className="grid grid-cols-3 gap-3">
                           {['low', 'medium', 'high'].map((level) => (
                              <div 
                                key={level}
                                onClick={() => setVideoQuality(level as any)}
                                className={`
                                  cursor-pointer border rounded-lg p-3 text-center transition-all
                                  ${videoQuality === level 
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-1 ring-primary-500' 
                                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                                  }
                                `}
                              >
                                 <div className="font-medium capitalize text-sm">{level}</div>
                                 <div className="text-[10px] text-slate-500 mt-1">
                                   {level === 'low' ? 'Best Quality' : level === 'high' ? 'Smallest Size' : 'Balanced'}
                                 </div>
                              </div>
                           ))}
                         </div>
                      </div>
                    )}

                    {/* Audio Settings */}
                    {tool.id === 'audio-compressor' && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Bitrate</label>
                        <Select 
                           value={audioBitrate}
                           onChange={(e) => setAudioBitrate(e.target.value)}
                           options={[
                             { label: '64 kbps (Low Quality)', value: '64k' },
                             { label: '128 kbps (Standard)', value: '128k' },
                             { label: '192 kbps (High Quality)', value: '192k' },
                             { label: '320 kbps (Lossless-like)', value: '320k' },
                           ]}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <Button 
                  onClick={handleProcess}
                  disabled={status === 'processing' || (!files.length && !textInput)}
                  className="w-full md:w-auto md:min-w-[200px] h-12 text-base shadow-lg shadow-primary-600/20"
                >
                  {status === 'processing' ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      Convert Now <ArrowRight className="ml-2" size={20} />
                    </>
                  )}
                </Button>
              </div>
           </div>
        ) : (
           // --- Result View ---
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="text-center py-8"
           >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ready to Download!</h2>
              <p className="text-slate-500 mb-8">Your file has been processed successfully.</p>
              
              {result.originalSize && result.newSize && (
                 <div className="flex justify-center gap-8 mb-8 text-sm">
                    <div>
                       <p className="text-slate-500 mb-1">Original Size</p>
                       <p className="font-semibold">{formatBytes(result.originalSize)}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-slate-500 mb-1">New Size</p>
                       <p className="font-semibold text-green-600">
                         {formatBytes(result.newSize)} 
                         <span className="ml-1 text-xs bg-green-100 px-1.5 py-0.5 rounded-full">
                           -{Math.round((1 - result.newSize/result.originalSize) * 100)}%
                         </span>
                       </p>
                    </div>
                 </div>
              )}

              {result.text && (
                 <div className="max-w-xl mx-auto mb-8 text-left">
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-sm font-medium text-slate-700">Result:</label>
                       <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigator.clipboard.writeText(result.text!)}
                          className="h-8 text-xs"
                       >
                          <Copy size={14} className="mr-1"/> Copy
                       </Button>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto text-sm font-mono whitespace-pre-wrap break-all">
                       {result.text}
                    </div>
                 </div>
              )}

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                 {result.url && (
                    <a 
                      href={result.url} 
                      download={result.filename || 'download'}
                      className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
                    >
                       <Download size={20} className="mr-2" />
                       Download File
                    </a>
                 )}
                 <Button variant="outline" onClick={reset} className="h-12">
                    <RefreshCw size={20} className="mr-2" />
                    Process Another
                 </Button>
              </div>
           </motion.div>
        )}
        
        {/* Error Message */}
        <AnimatePresence>
          {errorMsg && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 10 }}
               className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg border border-red-100 dark:border-red-900/50 flex items-start gap-3 text-sm"
             >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
             </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};