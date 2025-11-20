import React, { useState, useEffect } from 'react';
import { useRouter } from '../services/router';
import { Moon, Sun, Search, Menu, X, Github, Twitter, Command } from 'lucide-react';
import { Button, Input } from './UIComponents';
import { TOOLS } from '../constants';

const Navbar = () => {
  const { navigate } = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof TOOLS>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const results = TOOLS.filter(tool => 
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-800 dark:bg-slate-950/80 dark:supports-[backdrop-filter]:bg-slate-950/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div 
            className="flex items-center gap-2 font-bold text-xl cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
              <Command size={18} />
            </div>
            <span className="hidden sm:inline-block">AIO Tools</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            <button onClick={() => navigate('/')} className="hover:text-primary-600 px-3 py-2 transition-colors">Home</button>
            <button onClick={() => navigate('/#categories')} className="hover:text-primary-600 px-3 py-2 transition-colors">Categories</button>
            <button onClick={() => navigate('/')} className="hover:text-primary-600 px-3 py-2 transition-colors">Popular</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block w-64">
            <Input 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search tools..." 
              icon={<Search size={16} />}
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden py-1">
                {searchResults.map(tool => (
                  <div 
                    key={tool.id}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-3"
                    onClick={() => {
                      setSearchQuery('');
                      navigate(`/tool/${tool.id}`);
                    }}
                  >
                    <span className="text-sm font-medium">{tool.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button variant="ghost" onClick={() => setDarkMode(!darkMode)} className="w-10 h-10 p-0 rounded-full">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
          
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-4">
          <Input 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Search tools..." 
            icon={<Search size={16} />}
          />
           {searchResults.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden">
                {searchResults.map(tool => (
                  <div 
                    key={tool.id}
                    className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 last:border-0 cursor-pointer"
                    onClick={() => {
                      setSearchQuery('');
                      setMobileMenuOpen(false);
                      navigate(`/tool/${tool.id}`);
                    }}
                  >
                    <span className="text-sm font-medium">{tool.title}</span>
                  </div>
                ))}
              </div>
            )}
          <div className="flex flex-col space-y-2">
            <Button variant="ghost" onClick={() => navigate('/')} className="justify-start">Home</Button>
            <Button variant="ghost" onClick={() => navigate('/#categories')} className="justify-start">Categories</Button>
          </div>
        </div>
      )}
    </header>
  );
};

const Footer = () => (
  <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 py-12 mt-auto">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
              <Command size={18} />
            </div>
            <span>AIO Tools</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The ultimate all-in-one utility platform for converting, compressing, and editing files online.
          </p>
          <div className="flex gap-4">
             <Button variant="ghost" className="h-8 w-8 p-0"><Twitter size={18} /></Button>
             <Button variant="ghost" className="h-8 w-8 p-0"><Github size={18} /></Button>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-4">Tools</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><a href="#" className="hover:text-primary-600">PDF Tools</a></li>
            <li><a href="#" className="hover:text-primary-600">Image Converter</a></li>
            <li><a href="#" className="hover:text-primary-600">Video Compressor</a></li>
            <li><a href="#" className="hover:text-primary-600">Audio Extraction</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><a href="#" className="hover:text-primary-600">About Us</a></li>
            <li><a href="#" className="hover:text-primary-600">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-primary-600">Terms of Service</a></li>
            <li><a href="#" className="hover:text-primary-600">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Legal</h4>
           <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
             All files are automatically deleted from our servers after 1 hour. We do not store your data.
           </p>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
        © 2024 AIO Tools. All rights reserved.
      </div>
    </div>
  </footer>
);

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 animate-in fade-in duration-500">
        {children}
      </main>
      <Footer />
    </div>
  );
};