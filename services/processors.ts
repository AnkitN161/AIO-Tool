import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { marked } from 'marked';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import Tesseract from 'tesseract.js';

export interface ProcessResult {
  url?: string;
  text?: string;
  filename?: string;
  type: 'file' | 'text' | 'image';
  success: boolean;
  message?: string;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- FFmpeg Singleton & Loader ---
let ffmpeg: FFmpeg | null = null;

const loadFFmpeg = async () => {
  if (ffmpeg) return ffmpeg;
  
  const instance = new FFmpeg();
  
  // In a real production environment, you need to host the core files or point to a reliable CDN
  // AND ensure Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers are set on your server.
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  
  try {
    await instance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    ffmpeg = instance;
    return ffmpeg;
  } catch (e) {
    console.error("FFmpeg load error:", e);
    throw new Error("Video engine failed to load. This feature requires 'Cross-Origin-Opener-Policy' headers enabled on the server.");
  }
};

// --- Image Processors ---

const processImage = async (file: File, operation: 'convert' | 'compress' | 'resize' | 'grayscale', format: string = 'jpeg', quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Simple resize logic for demo (50%)
      if (operation === 'resize') {
        width = width * 0.5;
        height = height * 0.5;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (operation === 'grayscale') {
          ctx.filter = 'grayscale(100%)';
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        const mimeType = `image/${format}`;
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to Blob failed'));
        }, mimeType, quality);
      } else {
        reject(new Error('Canvas Context failed'));
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

const compressToTargetSize = async (file: File, targetKB: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context failed'));
      ctx.drawImage(img, 0, 0);

      const targetBytes = targetKB * 1024;
      let min = 0;
      let max = 1;
      let bestBlob: Blob | null = null;
      
      // Helper to get blob at quality
      const getBlob = (q: number): Promise<Blob> => {
        return new Promise(r => canvas.toBlob(b => r(b!), 'image/jpeg', q));
      };

      // 1. Check at 100% quality first
      const initialBlob = await getBlob(1.0);
      if (initialBlob.size <= targetBytes) {
         resolve(initialBlob);
         return;
      }

      // 2. Binary search for optimal quality (7 iterations gives ~0.008 precision)
      for(let i = 0; i < 7; i++) {
        const mid = (min + max) / 2;
        const blob = await getBlob(mid);
        
        if (blob.size <= targetBytes) {
          // This fits! Store it as a candidate, but try to increase quality (min moves up)
          bestBlob = blob;
          min = mid; 
        } else {
          // Too big, need to reduce quality (max moves down)
          max = mid; 
        }
      }

      // 3. Return best found blob, or the smallest possible (quality 0) if even that fails
      if (bestBlob) {
        resolve(bestBlob);
      } else {
        const minBlob = await getBlob(0.01); // Minimum quality
        resolve(minBlob); 
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// --- Video/Audio Processors (FFmpeg) ---

const processMedia = async (file: File, toolId: string): Promise<ProcessResult> => {
  const ffmpeg = await loadFFmpeg();
  const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
  const fileData = await fetchFile(file);
  
  await ffmpeg.writeFile(inputName, fileData);

  let outputName = '';
  let mimeType = '';
  const args: string[] = [];

  // Command logic based on tool ID
  if (toolId === 'extract-audio') {
    outputName = 'output.mp3';
    mimeType = 'audio/mpeg';
    // Extract audio, map audio stream 0, highest quality
    args.push('-i', inputName, '-vn', '-acodec', 'libmp3lame', '-q:a', '2', outputName);
  } 
  else if (toolId === 'video-to-gif') {
    outputName = 'output.gif';
    mimeType = 'image/gif';
    // Scale to 320px width, 10fps for optimization
    args.push('-i', inputName, '-vf', 'fps=10,scale=320:-1:flags=lanczos', '-c:v', 'gif', outputName);
  }
  else if (toolId === 'video-compressor') {
    outputName = 'compressed.mp4';
    mimeType = 'video/mp4';
    // CRF 28 is aggressive but good compression, preset fast
    args.push('-i', inputName, '-vcodec', 'libx264', '-crf', '28', '-preset', 'fast', outputName);
  }
  else if (toolId === 'mp4-to-avi') {
    outputName = 'output.avi';
    mimeType = 'video/x-msvideo';
    args.push('-i', inputName, outputName);
  }
  else if (toolId === 'mov-to-mp4' || toolId === 'avi-to-mp4' || toolId === 'mkv-to-mp4') {
    outputName = 'output.mp4';
    mimeType = 'video/mp4';
    args.push('-i', inputName, '-c:v', 'copy', '-c:a', 'copy', outputName);
  }
  else if (toolId === 'mp3-to-wav') {
    outputName = 'output.wav';
    mimeType = 'audio/wav';
    args.push('-i', inputName, outputName);
  }
  else if (toolId === 'wav-to-mp3' || toolId === 'm4a-to-mp3') {
    outputName = 'output.mp3';
    mimeType = 'audio/mpeg';
    args.push('-i', inputName, outputName);
  }
  else if (toolId === 'audio-compressor') {
    outputName = 'compressed.mp3';
    mimeType = 'audio/mpeg';
    // Reduce bitrate to 64k
    args.push('-i', inputName, '-b:a', '64k', outputName);
  }
  else {
    throw new Error(`Tool ${toolId} not implemented in media engine.`);
  }

  await ffmpeg.exec(args);
  const data = await ffmpeg.readFile(outputName);
  const url = URL.createObjectURL(new Blob([data], { type: mimeType }));

  // Cleanup to free memory
  try {
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
  } catch(e) {
    // Ignore deletion errors
  }

  return {
    success: true,
    type: 'file',
    url,
    filename: outputName
  };
};

// --- PDF Processors ---

const mergePDFs = async (files: File[]): Promise<Uint8Array> => {
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  return await mergedPdf.save();
};

const splitPDF = async (file: File): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const zip = new JSZip();

  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    const newDoc = await PDFDocument.create();
    const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
    newDoc.addPage(copiedPage);
    const pdfBytes = await newDoc.save();
    zip.file(`page-${i + 1}.pdf`, pdfBytes);
  }

  return await zip.generateAsync({ type: 'blob' });
};

const textToPDF = async (text: string): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;

  page.drawText(text, {
    x: 50,
    y: height - 4 * fontSize,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
    maxWidth: width - 100,
    lineHeight: fontSize + 4,
  });

  return await pdfDoc.save();
};

const imageToPDF = async (files: File[]): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const imageBytes = await file.arrayBuffer();
    let image;
    if (file.type === 'image/jpeg' || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) {
      image = await pdfDoc.embedJpg(imageBytes);
    } else if (file.type === 'image/png' || file.name.endsWith('.png')) {
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      // Skip unsupported formats in this basic demo
      continue;
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return await pdfDoc.save();
};

// --- Text/Data Processors ---

const jsonToCsv = async (file: File): Promise<string> => {
  const text = await file.text();
  try {
    const json = JSON.parse(text);
    const data = Array.isArray(json) ? json : [json];
    
    if (data.length === 0) return '';
    
    const keys = Object.keys(data[0]);
    const csvRows = [keys.join(',')];
    
    for (const row of data) {
      const values = keys.map(key => {
        const val = (row as any)[key];
        // Handle strings that might contain commas
        if (typeof val === 'string') {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  } catch (e) {
    throw new Error("Invalid JSON file");
  }
};

const encodeBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      // Remove data URL prefix
      const base64 = res.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- Main Processor Switch ---

export const processTool = async (
  toolId: string, 
  files: File[], 
  inputText: string = '',
  options: any = {}
): Promise<ProcessResult> => {
  try {
    // --- Video / Audio via FFmpeg ---
    if ([
      'mp4-to-avi', 'mov-to-mp4', 'avi-to-mp4', 'mkv-to-mp4', 
      'video-compressor', 'video-to-gif', 'extract-audio',
      'mp3-to-wav', 'wav-to-mp3', 'm4a-to-mp3', 'audio-compressor'
    ].includes(toolId)) {
      if (files.length === 0) throw new Error("No media file provided");
      return await processMedia(files[0], toolId);
    }

    // --- Images ---
    if (['jpg-to-png', 'png-to-jpg', 'webp-to-jpg', 'image-compressor', 'gr-scale-converter', 'image-resizer', 'svg-to-png'].includes(toolId)) {
      if (files.length === 0) throw new Error("No files provided");

      let targetFormat = 'jpeg';
      let operation: 'convert' | 'compress' | 'resize' | 'grayscale' = 'convert';

      if (toolId === 'jpg-to-png' || toolId === 'svg-to-png') targetFormat = 'png';
      if (toolId === 'image-compressor') operation = 'compress';
      if (toolId === 'image-resizer') operation = 'resize';
      
      const processFile = async (f: File) => {
        // Special logic for Target Size compression
        if (toolId === 'image-compressor' && options.compressMode === 'size' && options.targetSizeKB) {
          return await compressToTargetSize(f, options.targetSizeKB);
        } else {
          // Standard quality based
          const q = options.quality || (operation === 'compress' ? 0.6 : 0.9);
          return processImage(f, operation, targetFormat, q);
        }
      };
      
      const blobs = await Promise.all(files.map(f => processFile(f)));

      if (blobs.length === 1) {
        const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
        return { success: true, type: 'file', url: URL.createObjectURL(blobs[0]), filename: `processed.${ext}` };
      } else {
        const zip = new JSZip();
        blobs.forEach((blob, i) => {
           const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
           zip.file(`processed_${i + 1}.${ext}`, blob);
        });
        const content = await zip.generateAsync({ type: "blob" });
        return { success: true, type: 'file', url: URL.createObjectURL(content), filename: "images.zip" };
      }
    }

    // --- PDF ---
    if (toolId === 'merge-pdf') {
      if (files.length < 2) throw new Error("Please upload at least 2 PDF files to merge.");
      const mergedPdfBytes = await mergePDFs(files);
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      return { success: true, type: 'file', url: URL.createObjectURL(blob), filename: "merged_document.pdf" };
    }

    if (toolId === 'split-pdf') {
      if (files.length === 0) throw new Error("No PDF file provided");
      const zipBlob = await splitPDF(files[0]);
      return { success: true, type: 'file', url: URL.createObjectURL(zipBlob), filename: "split_pages.zip" };
    }

    if (toolId === 'image-to-pdf') {
      const pdfBytes = await imageToPDF(files);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      return { success: true, type: 'file', url: URL.createObjectURL(blob), filename: "images.pdf" };
    }

    if (toolId === 'text-to-pdf') {
      let text = inputText;
      if (files.length > 0) {
        text = await files[0].text();
      }
      if (!text) throw new Error("No text provided");
      
      const pdfBytes = await textToPDF(text);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      return { success: true, type: 'file', url: URL.createObjectURL(blob), filename: "document.pdf" };
    }

    if (toolId === 'markdown-to-html') {
       let text = inputText;
       if (files.length > 0) text = await files[0].text();
       if (!text) throw new Error("No markdown provided");
       
       const html = marked.parse(text);
       const blob = new Blob([html as string], { type: 'text/html' });
       return { success: true, type: 'file', url: URL.createObjectURL(blob), filename: "converted.html" };
    }

    // --- Advanced ---
    if (toolId === 'ocr-pdf') {
      if (files.length === 0) throw new Error("No file provided");
      
      // Tesseract.js primarily works with Images. It can handle PDF but requires specific workers.
      // For this demo, we check if it is an image.
      if (files[0].type.startsWith('image/')) {
        const worker = await Tesseract.createWorker("eng");
        const ret = await worker.recognize(files[0]);
        await worker.terminate();
        return { success: true, type: 'text', text: ret.data.text };
      } else {
         // If it's a PDF, client-side conversion is complex without pdf.js text layers.
         return { 
            success: false, 
            message: "Client-side OCR supports Image files (JPG, PNG). For PDFs, please convert them to images first.", 
            type: 'text' 
         };
      }
    }

    if (toolId === 'extract-archive') {
      if (files.length === 0) throw new Error("No archive provided");
      const zip = new JSZip();
      try {
        const loadedZip = await zip.loadAsync(files[0]);
        const fileNames: string[] = [];
        loadedZip.forEach((relativePath) => fileNames.push(relativePath));
        
        return { 
          success: true, 
          message: "Archive read successfully. Contents:", 
          type: 'text', 
          text: fileNames.join('\n') 
        };
      } catch (e) {
        throw new Error("Could not read archive. Ensure it is a valid ZIP file.");
      }
    }

    if (toolId === 'qr-generator') {
      if (!inputText) throw new Error("Please enter text to generate QR Code");
      const dataUrl = await QRCode.toDataURL(inputText, { width: 300, margin: 2 });
      return { success: true, type: 'image', url: dataUrl, filename: 'qrcode.png' };
    }

    if (toolId === 'base64-encoder') {
      if (files.length > 0) {
        const base64 = await encodeBase64(files[0]);
        return { success: true, type: 'text', text: base64 };
      } else if (inputText) {
        return { success: true, type: 'text', text: btoa(inputText) };
      }
    }

    if (toolId === 'json-to-csv') {
      if (files.length > 0) {
        const csv = await jsonToCsv(files[0]);
        const blob = new Blob([csv], { type: 'text/csv' });
        return { success: true, type: 'file', url: URL.createObjectURL(blob), filename: files[0].name + ".csv" };
      }
    }

    // --- Office Files Fallback ---
    if (['word-to-pdf', 'pdf-to-word', 'excel-to-pdf', 'ppt-to-pdf'].includes(toolId)) {
      // Try to hit localhost if the user happens to be running the backend, otherwise show error.
      try {
         if (files.length > 0) {
            const formData = new FormData();
            formData.append('file', files[0]);
            // 60s timeout to allow for large files or slow processing
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);
            
            const response = await fetch('http://localhost:3001/convert', {
               method: 'POST',
               body: formData,
               signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
               const blob = await response.blob();
               return { 
                  success: true, 
                  type: 'file', 
                  url: URL.createObjectURL(blob), 
                  filename: files[0].name.replace(/\.[^/.]+$/, "") + ".pdf" 
               };
            } else {
               throw new Error(response.statusText);
            }
         }
      } catch (e: any) {
         let msg = "Could not connect to local conversion server.";
         if (e.message === 'Failed to fetch') {
             msg += "\n\nPOSSIBLE CAUSE: Browser Security Blocking.";
             msg += "\nIf you see a 'Shield' icon in your address bar, click it and allow 'Unsafe scripts/content'.";
             msg += "\nThis is required because the web app is HTTPS but your local server is HTTP.";
         } else {
             msg += "\n\nPlease ensure your Docker container is running on port 3001.";
             msg += "\nClick 'Check Server Setup' below for instructions.";
         }
         return { 
            success: false, 
            message: msg,
            type: 'text' 
         };
      }

      return { 
        success: false, 
        message: "Could not connect to local conversion server.\n\nPlease ensure your Docker container is running on port 3001.\nClick 'Check Server Setup' below for instructions.", 
        type: 'text' 
      };
    }

    await wait(1000);
    return { success: false, message: "Tool not implemented yet.", type: 'text' };

  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || "An error occurred during processing.", type: 'text' };
  }
};