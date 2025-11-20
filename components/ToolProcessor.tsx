import React, { useState, useCallback, useEffect } from 'react';
import { Upload, File as FileIcon, X, CheckCircle, ArrowRight, Download, Loader2, RefreshCw, AlertCircle, Copy, Settings, Sliders, HardDrive, Server, Terminal, AlertTriangle, Zap, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Textarea, Input, Badge } from './UIComponents';
import { Tool } from '../types';
import { processTool, ProcessResult } from '../services/processors';

interface ToolProcessorProps {
  tool: Tool;
}

type ProcessStatus = 'idle' | 'processing' | 'completed' | 'error';

const OFFICE_TOOLS = ['word-to-pdf', 'excel-to-pdf', 'ppt-to-pdf', 'pdf-to-word', 'pdf-to-excel', 'pdf-to-ppt'];

export const ToolProcessor = ({ tool }: ToolProcessorProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState('');
  const [status, setStatus] = useState<ProcessStatus>('idle');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSetup, setShowSetup] = useState(false);

  // Compression Settings
  const [compressMode, setCompressMode] = useState<'quality' | 'size'>('quality');
  const [quality, setQuality] = useState(80);
  const [targetSize, setTargetSize] = useState(500); // KB

  const isTextInputTool = tool.id === 'qr-generator';
  const isHybridTool = ['base64-encoder', 'json-to-csv', 'text-to-pdf', 'markdown-to-html'].includes(tool.id);
  const isOfficeTool = OFFICE_TOOLS.includes(tool.id);

  // Reset when tool changes
  useEffect(() => {
    setFiles([]);
    setTextInput('');
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
    setQuality(80);
    setTargetSize(500);
    setCompressMode('quality');
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
      setFiles(prev => tool.id.includes('merge') || tool.id === 'image-to-pdf' || tool.id.includes('to-jpg') || tool.id.includes('to-png') || tool.id === 'image-compressor' ? [...prev, ...newFiles] : newFiles);
    }
  }, [tool.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => tool.id.includes('merge') || tool.id === 'image-to-pdf' || tool.id.includes('to-jpg') || tool.id.includes('to-png') || tool.id === 'image-compressor' ? [...prev, ...newFiles] : newFiles);
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
        targetSizeKB: targetSize
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
    alert('Copied to clipboard!');
  };

  const renderSettings = () => {
    if (tool.id === 'image-compressor' && files.length > 0) {
      return (
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
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
              <label className="text-xs text-slate-500">Max File Size (KB)</label>
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
        </div>
      );
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
          <div 
            className={`w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer ${dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className="p-4 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 mb-4">
              <Upload size={32} />
            </div>
            <p className="text-lg font-medium mb-1">Drag & Drop files here</p>
            <p className="text-sm text-slate-500 mb-6">or click to browse</p>
            <input id="file-upload" type="file" className="hidden" multiple={tool.id.includes('merge') || tool.id === 'image-to-pdf' || tool.id === 'image-compressor'} onChange={handleFileChange} />
            <Button variant="outline" onClick={(e) => { e.stopPropagation(); document.getElementById('file-upload')?.click(); }}>Select Files</Button>
            
            {isHybridTool && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 w-full max-w-xs text-center">
                 <p className="text-xs text-slate-400 mb-2">Or enter text directly</p>
                 <Textarea 
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type or paste content..."
                    className="min-h-[80px]"
                 />
                 <Button size="sm" className="mt-2 w-full" disabled={!textInput} onClick={(e) => { e.stopPropagation(); startConversion(); }}>
                    Convert Text
                 </Button>
              </div>
            )}
          </div>
         ) : (
           <div className="w-full space-y-4">
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 text-slate-500">
                        <FileIcon size={20} />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={() => removeFile(idx)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
              
              {renderSettings()}

              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
                <Button variant="ghost" onClick={reset} className="text-slate-500">Clear All</Button>
                <label className="cursor-pointer hidden sm:block">
                   <Button variant="outline">Add More</Button>
                   <input type="file" className="hidden" multiple onChange={handleFileChange} />
                </label>
                <Button onClick={startConversion} className="min-w-[140px]">
                  {tool.id === 'image-compressor' ? 'Compress Images' : (tool.id.includes('merge') ? 'Merge Files' : 'Convert Now')} <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
           </div>
         )}
      </div>
    );
  };

  const SetupGuideModal = () => {
    const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [pingError, setPingError] = useState('');

    const checkServer = async () => {
      setPingStatus('testing');
      setPingError('');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        // Ping root. Expect 404 or 200. The fact we get a response means server is UP.
        // If network error (mixed content), it will throw.
        const res = await fetch('http://localhost:3001/', { 
          method: 'GET', 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        // If we reach here, connection is successful (even if 404)
        setPingStatus('success');
      } catch (e: any) {
        setPingStatus('error');
        setPingError(e.message || 'Connection failed');
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
         <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative animate-in zoom-in-95">
            <button onClick={() => setShowSetup(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
               <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
               <Server className="text-primary-600" /> Setup Local Server
            </h2>
            
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Tools like Word, Excel, and PowerPoint conversion require a backend engine (LibreOffice). 
              Follow these steps to run it on your machine.
            </p>

            <div className="space-y-6">
               <div>
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm uppercase text-slate-500">Step 1: Create a folder named 'aio-backend'</h3>
                 </div>
               </div>

               <div>
                  <div className="flex items-center justify-between mb-2">
                     <h3 className="font-semibold text-sm uppercase text-slate-500">Step 2: Create 'Dockerfile'</h3>
                     <Button variant="ghost" size="sm" onClick={() => copyToClipboard(DOCKERFILE_CONTENT)}><Copy size={14} className="mr-1"/> Copy</Button>
                  </div>
                  <pre className="bg-slate-100 dark:bg-slate-950 p-4 rounded-lg text-xs font-mono overflow-x-auto border border-slate-200 dark:border-slate-800">
                    {DOCKERFILE_CONTENT}
                  </pre>
               </div>

               <div>
                  <div className="flex items-center justify-between mb-2">
                     <h3 className="font-semibold text-sm uppercase text-slate-500">Step 3: Create 'server.js'</h3>
                     <Button variant="ghost" size="sm" onClick={() => copyToClipboard(SERVER_JS_CONTENT)}><Copy size={14} className="mr-1"/> Copy</Button>
                  </div>
                  <pre className="bg-slate-100 dark:bg-slate-950 p-4 rounded-lg text-xs font-mono overflow-x-auto border border-slate-200 dark:border-slate-800">
                    {SERVER_JS_CONTENT}
                  </pre>
               </div>

               <div>
                  <div className="flex items-center justify-between mb-2">
                     <h3 className="font-semibold text-sm uppercase text-slate-500">Step 4: Create 'package.json'</h3>
                     <Button variant="ghost" size="sm" onClick={() => copyToClipboard(PACKAGE_JSON_CONTENT)}><Copy size={14} className="mr-1"/> Copy</Button>
                  </div>
                  <pre className="bg-slate-100 dark:bg-slate-950 p-4 rounded-lg text-xs font-mono overflow-x-auto border border-slate-200 dark:border-slate-800">
                    {PACKAGE_JSON_CONTENT}
                  </pre>
               </div>

               <div>
                  <div className="flex items-center justify-between mb-2">
                     <h3 className="font-semibold text-sm uppercase text-slate-500">Step 5: Build the Image</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Run this first. If you get "image not found", it means this step failed.</p>
                  <div className="bg-slate-900 text-slate-50 p-4 rounded-lg text-sm font-mono space-y-2">
                     <div className="flex gap-2">
                        <span className="text-slate-500 select-none">$</span> cd aio-backend
                     </div>
                     <div className="flex gap-2">
                        <span className="text-slate-500 select-none">$</span> docker build -t aio-server .
                     </div>
                  </div>
               </div>

               <div>
                  <div className="flex items-center justify-between mb-2">
                     <h3 className="font-semibold text-sm uppercase text-slate-500">Step 6: Start the Server</h3>
                  </div>
                  <div className="bg-slate-900 text-slate-50 p-4 rounded-lg text-sm font-mono space-y-2">
                     <div className="flex gap-2">
                        <span className="text-slate-500 select-none">$</span> docker run -p 3001:3001 aio-server
                     </div>
                  </div>
               </div>

               <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Zap size={18} />
                        <h3 className="font-bold text-sm uppercase">Step 7: Connect & Test</h3>
                     </div>
                     <Button size="sm" onClick={checkServer} disabled={pingStatus === 'testing'} className="bg-blue-600 hover:bg-blue-700">
                       {pingStatus === 'testing' ? <><Activity size={14} className="mr-2 animate-pulse"/> Testing...</> : 'Ping Server'}
                     </Button>
                  </div>
                  
                  {pingStatus === 'idle' && (
                     <p className="text-sm text-blue-700/80 dark:text-blue-300/80">
                        Click the button above to check if the web app can see your local server.
                     </p>
                  )}

                  {pingStatus === 'success' && (
                     <div className="mt-2 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded flex items-start gap-2">
                        <CheckCircle size={18} className="shrink-0 mt-0.5" />
                        <div>
                           <span className="font-bold">Connected!</span> Your server is running and accessible. You can now close this guide and convert your files.
                        </div>
                     </div>
                  )}

                  {pingStatus === 'error' && (
                     <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded">
                        <p className="font-bold flex items-center gap-2"><AlertTriangle size={16}/> Connection Failed</p>
                        <p className="mt-1 font-mono text-xs opacity-90 mb-2">Error: {pingError === 'Failed to fetch' ? 'Network Error / Mixed Content Blocked' : pingError}</p>
                        
                        <div className="bg-white/50 dark:bg-black/20 p-2 rounded text-xs">
                           <strong>Likely Cause: Browser Security (Mixed Content)</strong>
                           <br/>
                           Because this site is HTTPS and your local server is HTTP, your browser is blocking the connection.
                           <ul className="list-disc list-inside mt-1 ml-1">
                              <li>Look for a <strong>Shield Icon</strong> or "Not Secure" warning in your address bar.</li>
                              <li>Click it and select <strong>"Site Settings" -> Allow Insecure Content</strong> or <strong>"Load Unsafe Scripts"</strong>.</li>
                           </ul>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            <div className="mt-8 flex justify-end">
               <Button onClick={() => setShowSetup(false)}>Done</Button>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {showSetup && <SetupGuideModal />}

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{tool.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">{tool.description}</p>
      </div>

      {isOfficeTool && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-blue-700 dark:text-blue-300">
           <div className="flex items-center gap-3">
              <Server size={20} className="shrink-0" />
              <div className="text-sm">
                 <span className="font-bold block">Requires Local Server</span>
                 This tool needs a companion backend to process complex files.
              </div>
           </div>
           <Button size="sm" variant="outline" className="shrink-0 bg-white dark:bg-slate-900 hover:bg-blue-50 border-blue-200" onClick={() => setShowSetup(true)}>
             View Setup Guide
           </Button>
        </div>
      )}

      <Card className="p-8 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              {renderInputSection()}
            </motion.div>
          )}

          {status === 'processing' && (
             <motion.div 
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center w-full text-center py-12"
             >
                <div className="mb-6 relative">
                   <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping"></div>
                   <div className="relative p-6 bg-white dark:bg-slate-900 rounded-full border-2 border-primary-100 dark:border-primary-900 shadow-xl">
                      <Loader2 size={48} className="text-primary-600 animate-spin" />
                   </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Processing...</h3>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto">Please wait while we handle your request.</p>
             </motion.div>
          )}

          {status === 'error' && (
             <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center w-full text-center py-8"
             >
               <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 mb-6">
                 <AlertCircle size={48} />
               </div>
               <h3 className="text-2xl font-bold mb-2">Something went wrong</h3>
               <p className="text-slate-500 mb-8 max-w-lg mx-auto whitespace-pre-line">{errorMsg || "Failed to process file."}</p>
               
               {isOfficeTool && (
                 <Button variant="outline" onClick={() => setShowSetup(true)} className="mb-4">
                    <Terminal size={16} className="mr-2" /> Check Server Setup
                 </Button>
               )}
               <div className="block">
                  <Button onClick={reset}>Try Again</Button>
               </div>
             </motion.div>
          )}

          {status === 'completed' && result && (
            <motion.div 
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center w-full text-center py-8"
            >
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 mb-6">
                <CheckCircle size={48} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Success!</h3>
              <p className="text-slate-500 mb-8">{result.message || "Your content is ready."}</p>
              
              {result.type === 'image' && result.url && (
                <div className="mb-8 border p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                  <img src={result.url} alt="Generated" className="max-w-[200px] max-h-[300px] w-auto h-auto" />
                </div>
              )}

              {result.type === 'text' && result.text && (
                <div className="w-full max-w-lg mb-8 relative">
                  <Textarea value={result.text} onChange={() => {}} className="font-mono text-xs min-h-[150px]" />
                  <Button variant="secondary" onClick={() => copyToClipboard(result.text || '')} className="absolute top-2 right-2 h-8 px-2 text-xs">
                    <Copy size={14} className="mr-1" /> Copy
                  </Button>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                {result.url && (
                  <a href={result.url} download={result.filename || "download"}>
                    <Button className="h-12 px-8 text-lg shadow-lg shadow-primary-500/20">
                      <Download size={20} className="mr-2" /> Download
                    </Button>
                  </a>
                )}
                <Button variant="outline" onClick={reset} className="h-12 px-8">
                  <RefreshCw size={18} className="mr-2" /> Process Another
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
      
      <div className="grid md:grid-cols-3 gap-6 text-left">
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary-500" />Client-Side Secure</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">Files are processed directly in your browser. We never upload your data to any server.</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary-500" />High Performance</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">Utilizing advanced WebAssembly and browser APIs for native-speed conversions.</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary-500" />Free Forever</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">No hidden fees, no daily limits, and no watermarks on your generated files.</p>
        </div>
      </div>
    </div>
  );
};

const DOCKERFILE_CONTENT = `FROM node:18-slim

RUN apt-get update && apt-get install -y \\
    libreoffice \\
    default-jre \\
    fonts-opensymbol \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

EXPOSE 3001
CMD ["node", "server.js"]`;

const SERVER_JS_CONTENT = `const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());

// Health check endpoint
app.get('/', (req, res) => res.send('AIO Server Ready'));

app.post('/convert', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');

  const inputPath = req.file.path;
  const outputDir = 'outputs';
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const command = \`soffice --headless --convert-to pdf "\${inputPath}" --outdir "\${outputDir}"\`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Conversion failed');
    }

    const originalName = req.file.originalname;
    const nameWithoutExt = path.parse(originalName).name;
    const outputFilePath = path.join(outputDir, \`\${path.parse(inputPath).name}.pdf\`);

    res.download(outputFilePath, \`\${nameWithoutExt}.pdf\`, (err) => {
      fs.unlinkSync(inputPath);
      if (fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath);
    });
  });
});

app.listen(3001, () => console.log('Server running on port 3001'));`;

const PACKAGE_JSON_CONTENT = `{
  "name": "aio-backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5"
  }
}`;