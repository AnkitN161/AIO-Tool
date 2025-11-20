
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
    
    if (id === 'merge-pdf' || id === 'split-pdf' || id === 'ocr-pdf' || (id.startsWith('pdf-