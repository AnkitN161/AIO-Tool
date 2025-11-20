
import React, { useState } from 'react';
import { RouterProvider, useRouter } from './services/router';
import { Layout } from './components/Layout';
import { CategoryId } from './types';
import { CATEGORIES, TOOLS } from './constants';
import * as Icons from 'lucide-react';
import { Card, Badge, Button, Input } from './components/UIComponents';
import { ToolProcessor } from './components/ToolProcessor';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 24 
    } 
  }
};

// --- Sub-components for Category Page ---

const CategoryFAQ = ({ categoryTitle }: { categoryTitle: string }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    className="mt-16 border-t border-slate-200 dark:border-slate-800 pt-10"
  >
    <h2 className="text-2xl font-bold mb-8 text-slate-900 dark:text-slate-100">Frequently Asked Questions</h2>
    <div className="grid gap-x-8 gap-y-8 md:grid-cols-2">
       <div className="space-y-2">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Icons.HelpCircle size={16} className="text-primary-500"/> Is it free to use these {categoryTitle} tools?
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed pl-6">Yes, all our tools in the {categoryTitle} category are 100% free to use. There are no hidden limits or subscription fees required for basic usage.</p>
       </div>
       <div className="space-y-2">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Icons.Lock size={16} className="text-primary-500"/> Are my files safe?
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed pl-6">Absolutely. We use industry-standard SSL encryption for all data transfers. Your files are processed securely and are permanently deleted from our servers after 1 hour.</p>
       </div>
       <div className="space-y-2">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Icons.Download size={16} className="text-primary-500"/> Do I need to install software?
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed pl-6">No installation is required. AIO Tools works entirely in your web browser. You can use it on Windows, Mac, Linux, or mobile devices.</p>
       </div>
       <div className="space-y-2">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Icons.Smartphone size={16} className="text-primary-500"/> Can I use this on my phone?
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed pl-6">Yes! Our platform is fully responsive and optimized for touch devices, so you can convert and compress files on the go.</p>
       </div>
    </div>
  </motion.div>
);

// --- Page Components ---

const HomePage = () => {
  const { navigate, path } = useRouter();

  // Handle scroll to categories if URL hash matches
  React.useEffect(() => {
    if (path === '/#categories' || path === '/categories') {
      // Small timeout ensures DOM is ready
      setTimeout(() => {
        const element = document.getElementById('categories');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
    // Global scroll to top for other paths is handled in AppContent
  }, [path]);

  return (
    <div className="space-y-16 pb-10">
      {/* Hero */}
      <section className="text-center space-y-6 py-12 md:py-20">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          Convert, Compress & Merge <br className="hidden md:block" />
          <span className="text-primary-600">All in One Place</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto"
        >
          100% free online tools to handle your documents, images, audio, and video files easily. No software installation required.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4, type: 'spring' }}
          className="flex justify-center gap-4 pt-4"
        >
          <Button onClick={() => navigate('/category/documents')} className="h-12 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all">
            Explore Tools
          </Button>
        </motion.div>
      </section>

      {/* Categories */}
      <section id="categories" className="space-y-8 scroll-mt-24">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between"
        >
          <h2 className="text-2xl font-bold">Browse by Category</h2>
        </motion.div>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {CATEGORIES.map(cat => {
            // Dynamic Icon
            const IconComponent = (Icons as any)[cat.icon] || Icons.Box;
            
            return (
              <motion.div key={cat.id} variants={itemVariants}>
                <Card 
                  onClick={() => navigate(`/category/${cat.id}`)}
                  className="p-6 hover:-translate-y-1 transition-all duration-300 group hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 cursor-pointer h-full"
                >
                  <div className={`w-12 h-12 rounded-xl ${cat.color} bg-opacity-10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`text-opacity-100 ${cat.textColor}`} size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{cat.description}</p>
                  <div className="flex items-center text-sm font-medium text-primary-600 group-hover:translate-x-1 transition-transform">
                    View Tools <Icons.ArrowRight size={16} className="ml-1" />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
};

const CategoryPage = ({ categoryId }: { categoryId: string }) => {
  const { navigate } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  const activeCategory = CATEGORIES.find(c => c.id === categoryId);
  const tools = TOOLS.filter(t => t.categoryId === categoryId);

  const filteredTools = tools.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!activeCategory) return <div className="text-center py-20">Category not found</div>;

  return (
    <div className="space-y-8 pb-12">
       <motion.div 
         initial={{ opacity: 0, y: -10 }}
         animate={{ opacity: 1, y: 0 }}
         className="flex items-center gap-2 text-sm text-slate-500"
       >
          <span className="cursor-pointer hover:text-primary-600" onClick={() => navigate('/')}>Home</span>
          <Icons.ChevronRight size={14} />
          <span className="text-slate-900 dark:text-slate-200 font-medium">{activeCategory.title}</span>
       </motion.div>

       <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Navigation */}
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24"
          >
             <h3 className="font-bold text-lg mb-4 px-1 hidden lg:block text-slate-900 dark:text-slate-100">Categories</h3>
             <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0" style={{ scrollbarWidth: 'none' }}>
                {CATEGORIES.map(cat => {
                   const IconComponent = (Icons as any)[cat.icon] || Icons.Box;
                   const isActive = cat.id === categoryId;
                   return (
                      <button
                        key={cat.id}
                        onClick={() => navigate(`/category/${cat.id}`)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                          isActive 
                            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' 
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                         <IconComponent size={18} />
                         {cat.title}
                         {isActive && <Icons.ChevronRight size={16} className="ml-auto hidden lg:block" />}
                      </button>
                   )
                })}
             </div>
          </motion.aside>

          {/* Main Content */}
          <div className="flex-1 w-full min-w-0">
             <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 bg-primary-50 dark:bg-primary-900/10 p-6 rounded-2xl border border-primary-100 dark:border-primary-900/50"
             >
                <div className="flex items-center gap-4 mb-2">
                   <div className={`p-3 rounded-xl ${activeCategory.color} text-white shadow-lg shadow-primary-600/20`}>
                      {React.createElement((Icons as any)[activeCategory.icon] || Icons.Box, { size: 24 })}
                   </div>
                   <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">{activeCategory.title}</h1>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">{activeCategory.description}</p>
                   </div>
                </div>
             </motion.div>

             <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Available Tools</h2>
                <div className="w-full max-w-xs">
                  <Input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Search ${activeCategory.title.toLowerCase()} tools...`}
                    icon={<Icons.Search size={16}/>}
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
             </div>

             <motion.div 
               variants={containerVariants}
               initial="hidden"
               animate="visible"
               key={categoryId + searchTerm} // Forces animation reset
               className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
             >
               {filteredTools.map(tool => {
                 const IconComponent = (Icons as any)[tool.icon] || Icons.File;
                 return (
                   <motion.div key={tool.id} variants={itemVariants} className="h-full">
                     <Card 
                        className="flex flex-col p-5 h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-slate-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800/50"
                        onClick={() => navigate(`/tool/${tool.id}`)}
                      >
                       <div className="flex items-center justify-between mb-4">
                         <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300">
                           <IconComponent size={22} />
                         </div>
                         {tool.popular && (
                           <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
                             Popular
                           </span>
                         )}
                       </div>
                       <h3 className="font-bold text-base mb-2 text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                         {tool.title}
                       </h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                         {tool.description}
                       </p>
                       <div className="mt-auto flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                         Open Tool <Icons.ArrowRight size={16} className="ml-1" />
                       </div>
                     </Card>
                   </motion.div>
                 );
               })}
               {filteredTools.length === 0 && (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                       <Icons.SearchX size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No tools found</h3>
                    <p className="text-slate-500 dark:text-slate-400">Try adjusting your search query.</p>
                  </div>
               )}
             </motion.div>

             <CategoryFAQ categoryTitle={activeCategory.title} />
          </div>
       </div>
    </div>
  );
};

const ToolPage = ({ toolId }: { toolId: string }) => {
  const { navigate } = useRouter();
  const tool = TOOLS.find(t => t.id === toolId);
  
  if (!tool) return <div className="text-center py-20">Tool not found</div>;

  const category = CATEGORIES.find(c => c.id === tool.categoryId);

  return (
    <div className="space-y-8">
       <motion.div 
         initial={{ opacity: 0, y: -10 }}
         animate={{ opacity: 1, y: 0 }}
         className="flex items-center gap-2 text-sm text-slate-500 mb-2"
       >
          <span className="cursor-pointer hover:text-primary-600" onClick={() => navigate('/')}>Home</span>
          <Icons.ChevronRight size={14} />
          <span className="cursor-pointer hover:text-primary-600" onClick={() => navigate(`/category/${category?.id}`)}>{category?.title}</span>
          <Icons.ChevronRight size={14} />
          <span className="text-slate-900 dark:text-slate-200">{tool.title}</span>
       </motion.div>

       <ToolProcessor tool={tool} />

       {/* Related Tools */}
       <motion.div 
         initial={{ opacity: 0 }}
         whileInView={{ opacity: 1 }}
         viewport={{ once: true }}
         transition={{ delay: 0.2 }}
         className="pt-16 border-t border-slate-200 dark:border-slate-800"
       >
         <h3 className="text-xl font-bold mb-6">Related Tools</h3>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TOOLS.filter(t => t.categoryId === tool.categoryId && t.id !== tool.id).slice(0, 3).map(t => {
              const IconComponent = (Icons as any)[t.icon] || Icons.File;
               return (
                 <Card key={t.id} onClick={() => navigate(`/tool/${t.id}`)} className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <div className="flex items-center gap-3">
                       <IconComponent size={18} className="text-slate-500" />
                       <span className="font-medium">{t.title}</span>
                    </div>
                 </Card>
               )
            })}
         </div>
       </motion.div>
    </div>
  );
};

// --- Main App Router Switch ---

const AppContent = () => {
  const { path, params } = useRouter();

  // Global Scroll Reset
  React.useEffect(() => {
    // Don't scroll if navigating to categories anchor on home page
    if (path === '/#categories' || path === '/categories') return;
    
    window.scrollTo(0, 0);
  }, [path]);

  // Routing Logic
  let content;
  let key = path;

  // Fix: Added explicit checks for /#categories and /categories
  const isHome = path === '/' || path === '' || path === '/#categories' || path === '/categories';

  if (isHome) {
    content = <HomePage />;
    key = 'home'; // Constant key avoids re-mounting when switching anchors on home
  } else if (path.startsWith('/category/')) {
    const id = params.id || path.split('/')[2];
    content = <CategoryPage categoryId={id} />;
    key = `cat-${id}`;
  } else if (path.startsWith('/tool/')) {
    const id = params.id || path.split('/')[2];
    content = <ToolPage toolId={id} />;
    key = `tool-${id}`;
  } else {
    content = (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">404</h1>
        <p className="text-slate-500">Page not found</p>
        <Button onClick={() => window.location.hash = '/'}>Go Home</Button>
      </div>
    );
    key = '404';
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 15, filter: 'blur(5px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -15, filter: 'blur(5px)' }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-full"
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <RouterProvider>
      <Layout>
        <AppContent />
      </Layout>
    </RouterProvider>
  );
};

export default App;