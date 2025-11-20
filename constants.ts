import { Category, CategoryId, Tool } from './types';

export const CATEGORIES: Category[] = [
  {
    id: CategoryId.DOCUMENTS,
    title: 'Documents',
    description: 'Convert, merge, and edit PDF, Word, Excel, and more.',
    icon: 'FileText',
    color: 'bg-blue-500',
  },
  {
    id: CategoryId.IMAGES,
    title: 'Images',
    description: 'Resize, crop, and convert JPG, PNG, WEBP, SVG.',
    icon: 'Image',
    color: 'bg-purple-500',
  },
  {
    id: CategoryId.AUDIO,
    title: 'Audio',
    description: 'Convert MP3, WAV, extract audio, and compress.',
    icon: 'Music',
    color: 'bg-pink-500',
  },
  {
    id: CategoryId.VIDEO,
    title: 'Video',
    description: 'Edit, compress, and convert MP4, AVI, MOV.',
    icon: 'Video',
    color: 'bg-red-500',
  },
  {
    id: CategoryId.ARCHIVES,
    title: 'Archives',
    description: 'Compress and extract ZIP, RAR, 7Z formats.',
    icon: 'Archive',
    color: 'bg-orange-500',
  },
  {
    id: CategoryId.ADVANCED,
    title: 'Advanced',
    description: 'OCR, JSON, Base64, QR Codes, and developer tools.',
    icon: 'Cpu',
    color: 'bg-slate-600',
  },
];

export const TOOLS: Tool[] = [
  // Documents
  { id: 'pdf-to-word', title: 'PDF to Word', description: 'Convert PDF documents to editable Word files.', categoryId: CategoryId.DOCUMENTS, icon: 'FileText', popular: true },
  { id: 'word-to-pdf', title: 'Word to PDF', description: 'Convert Word docs to ISO-standard PDF.', categoryId: CategoryId.DOCUMENTS, icon: 'File' },
  { id: 'excel-to-pdf', title: 'Excel to PDF', description: 'Make Excel spreadsheets easy to read by converting to PDF.', categoryId: CategoryId.DOCUMENTS, icon: 'Sheet' },
  { id: 'pdf-to-excel', title: 'PDF to Excel', description: 'Extract data from PDF tables to Excel.', categoryId: CategoryId.DOCUMENTS, icon: 'Table' },
  { id: 'ppt-to-pdf', title: 'PowerPoint to PDF', description: 'Turn your slides into a professional PDF.', categoryId: CategoryId.DOCUMENTS, icon: 'Presentation' },
  { id: 'pdf-to-ppt', title: 'PDF to PowerPoint', description: 'Convert PDFs back to editable slides.', categoryId: CategoryId.DOCUMENTS, icon: 'MonitorPlay' },
  { id: 'text-to-pdf', title: 'Text to PDF', description: 'Convert plain text files to PDF.', categoryId: CategoryId.DOCUMENTS, icon: 'FileType2' },
  { id: 'pdf-to-text', title: 'PDF to Text', description: 'Extract plain text from PDF documents.', categoryId: CategoryId.DOCUMENTS, icon: 'AlignLeft' },
  { id: 'html-to-pdf', title: 'HTML to PDF', description: 'Save webpages as PDF documents.', categoryId: CategoryId.DOCUMENTS, icon: 'Globe' },
  { id: 'merge-pdf', title: 'Merge PDFs', description: 'Combine multiple PDFs into one unified file.', categoryId: CategoryId.DOCUMENTS, icon: 'Files', popular: true },
  { id: 'split-pdf', title: 'Split PDF', description: 'Separate one page or a whole set for easy conversion.', categoryId: CategoryId.DOCUMENTS, icon: 'Scissors' },

  // Images
  { id: 'jpg-to-png', title: 'JPG to PNG', description: 'Convert JPG images to PNG with transparent background.', categoryId: CategoryId.IMAGES, icon: 'Image', popular: true },
  { id: 'png-to-jpg', title: 'PNG to JPG', description: 'Convert PNG to JPG for smaller file sizes.', categoryId: CategoryId.IMAGES, icon: 'Image' },
  { id: 'webp-to-jpg', title: 'WEBP to JPG', description: 'Convert modern WEBP images to classic JPG.', categoryId: CategoryId.IMAGES, icon: 'FileImage' },
  { id: 'heic-to-jpg', title: 'HEIC to JPG', description: 'Convert iPhone photos to widely supported JPG.', categoryId: CategoryId.IMAGES, icon: 'Camera' },
  { id: 'svg-to-png', title: 'SVG to PNG', description: 'Rasterize vector SVG files to PNG images.', categoryId: CategoryId.IMAGES, icon: 'PenTool' },
  { id: 'image-compressor', title: 'Image Compressor', description: 'Reduce image file size without losing quality.', categoryId: CategoryId.IMAGES, icon: 'Minimize2', popular: true },
  { id: 'remove-bg', title: 'Background Remover', description: 'Automatically remove background from images.', categoryId: CategoryId.IMAGES, icon: 'Eraser', popular: true },
  { id: 'image-resizer', title: 'Image Resizer', description: 'Resize images to exact dimensions.', categoryId: CategoryId.IMAGES, icon: 'Move' },

  // Audio
  { id: 'mp3-to-wav', title: 'MP3 to WAV', description: 'Convert compressed MP3 to lossless WAV.', categoryId: CategoryId.AUDIO, icon: 'Music' },
  { id: 'wav-to-mp3', title: 'WAV to MP3', description: 'Compress WAV files to standard MP3.', categoryId: CategoryId.AUDIO, icon: 'Mic' },
  { id: 'm4a-to-mp3', title: 'M4A to MP3', description: 'Convert Apple audio files to universal MP3.', categoryId: CategoryId.AUDIO, icon: 'Headphones' },
  { id: 'audio-compressor', title: 'Audio Compressor', description: 'Shrink audio file sizes for easy sharing.', categoryId: CategoryId.AUDIO, icon: 'Minimize' },
  { id: 'extract-audio', title: 'Extract Audio', description: 'Rip audio tracks (MP3) from video files.', categoryId: CategoryId.AUDIO, icon: 'Film', popular: true },

  // Video
  { id: 'mp4-to-avi', title: 'MP4 to AVI', description: 'Convert MP4 videos to AVI format.', categoryId: CategoryId.VIDEO, icon: 'Video' },
  { id: 'mov-to-mp4', title: 'MOV to MP4', description: 'Convert QuickTime videos to MP4.', categoryId: CategoryId.VIDEO, icon: 'Film' },
  { id: 'video-compressor', title: 'Video Compressor', description: 'Reduce video size effectively.', categoryId: CategoryId.VIDEO, icon: 'Minimize2', popular: true },
  { id: 'video-to-gif', title: 'Video to GIF', description: 'Create animated GIFs from video clips.', categoryId: CategoryId.VIDEO, icon: 'ImagePlus' },
  { id: 'trim-video', title: 'Trim Video', description: 'Cut unwanted parts from your video.', categoryId: CategoryId.VIDEO, icon: 'Scissors' },

  // Archives
  { id: 'zip-to-rar', title: 'ZIP to RAR', description: 'Convert ZIP archives to RAR format.', categoryId: CategoryId.ARCHIVES, icon: 'Package' },
  { id: 'rar-to-zip', title: 'RAR to ZIP', description: 'Convert RAR archives to standard ZIP.', categoryId: CategoryId.ARCHIVES, icon: 'Box' },
  { id: 'extract-archive', title: 'Extract Archive', description: 'Unzip and extract files online.', categoryId: CategoryId.ARCHIVES, icon: 'FolderOpen', popular: true },

  // Advanced
  { id: 'ocr-pdf', title: 'OCR PDF', description: 'Make scanned PDFs searchable and editable.', categoryId: CategoryId.ADVANCED, icon: 'ScanText', popular: true },
  { id: 'json-to-csv', title: 'JSON to CSV', description: 'Convert structured JSON data to CSV tables.', categoryId: CategoryId.ADVANCED, icon: 'FileCode' },
  { id: 'qr-generator', title: 'QR Generator', description: 'Create custom QR codes for links and text.', categoryId: CategoryId.ADVANCED, icon: 'QrCode' },
  { id: 'base64-encoder', title: 'Base64 Encoder', description: 'Encode text or files to Base64 string.', categoryId: CategoryId.ADVANCED, icon: 'Code' },
];