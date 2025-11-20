import React from 'react';
import { RouterProvider, useRouter } from './services/router';
import { Layout } from './components/Layout';
import { CategoryId } from './types';
import { CATEGORIES, TOOLS } from './constants';
import * as Icons from 'lucide-react';
import { Card, Badge, Button } from './components/UIComponents';
import { ToolProcessor } from './components/ToolProcessor';

// --- Page Components ---

const HomePage = () => {
  const { navigate } = useRouter();
  const popularTools = TOOLS.filter(t => t.popular);

  return (
    <div className="space-y-16 pb-10">
      {/* Hero */}
      <section className="text-center space-y-6 py-12 md:py-20">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Convert, Compress & Merge <br className="hidden md:block" />
          <span className="text-primary-600">All in One Place</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          100% free online tools to handle your documents, images, audio, and video files easily. No software installation required.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button onClick={() => navigate('/category/documents')} className="h-12 px-8 text-lg rounded-full">
            Explore Tools
          </Button>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Browse by Category</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map(cat => {
            // Dynamic Icon
            const IconComponent = (Icons as any)[cat.icon] || Icons.Box;
            
            return (
              <Card 
                key={cat.id} 
                onClick={() => navigate(`/category/${cat.id}`)}
                className="p-6 hover:-translate-y-1 transition-transform duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl ${cat.color} bg-opacity-10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <IconComponent className={`text-opacity-100 ${cat.color.replace('bg-', 'text-')}`} size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{cat.description}</p>
                <div className="flex items-center text-sm font-medium text-primary-600 group-hover:translate-x-1 transition-transform">
                  View Tools <Icons.ArrowRight size={16} className="ml-1" />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Popular Tools */}
      <section className="space-y-8">
         <h2 className="text-2xl font-bold">Most Popular Tools</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularTools.map(tool => {
              const IconComponent = (Icons as any)[tool.icon] || Icons.File;
              return (
                <Card key={tool.id} onClick={() => navigate(`/tool/${tool.id}`)} className="p-4 hover:border-primary-500 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{tool.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{tool.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
         </div>
      </section>
    </div>
  );
};

const CategoryPage = ({ categoryId }: { categoryId: string }) => {
  const { navigate } = useRouter();
  const category = CATEGORIES.find(c => c.id === categoryId);
  const tools = TOOLS.filter(t => t.categoryId === categoryId);

  if (!category) return <div className="text-center py-20">Category not found</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
             <span className="cursor-pointer hover:text-primary-600" onClick={() => navigate('/')}>Home</span>
             <Icons.ChevronRight size={14} />
             <span className="text-slate-900 dark:text-slate-200">{category.title}</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {category.title}
            <Badge className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">{tools.length} Tools</Badge>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{category.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tools.map(tool => {
          const IconComponent = (Icons as any)[tool.icon] || Icons.File;
          return (
            <Card key={tool.id} className="flex flex-col p-5 h-full hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <IconComponent size={24} className="text-primary-600" />
                </div>
                {tool.popular && <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Hot</Badge>}
              </div>
              <h3 className="font-bold text-lg mb-2">{tool.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 mb-6">{tool.description}</p>
              <Button 
                variant="outline" 
                fullWidth 
                onClick={() => navigate(`/tool/${tool.id}`)}
                className="mt-auto group"
              >
                Open Tool <Icons.ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          );
        })}
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
       <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <span className="cursor-pointer hover:text-primary-600" onClick={() => navigate('/')}>Home</span>
          <Icons.ChevronRight size={14} />
          <span className="cursor-pointer hover:text-primary-600" onClick={() => navigate(`/category/${category?.id}`)}>{category?.title}</span>
          <Icons.ChevronRight size={14} />
          <span className="text-slate-900 dark:text-slate-200">{tool.title}</span>
       </div>

       <ToolProcessor tool={tool} />

       {/* Related Tools */}
       <div className="pt-16 border-t border-slate-200 dark:border-slate-800">
         <h3 className="text-xl font-bold mb-6">Related Tools</h3>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TOOLS.filter(t => t.categoryId === tool.categoryId && t.id !== tool.id).slice(0, 3).map(t => {
              const IconComponent = (Icons as any)[t.icon] || Icons.File;
               return (
                 <Card key={t.id} onClick={() => navigate(`/tool/${t.id}`)} className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900">
                    <div className="flex items-center gap-3">
                       <IconComponent size={18} className="text-slate-500" />
                       <span className="font-medium">{t.title}</span>
                    </div>
                 </Card>
               )
            })}
         </div>
       </div>
    </div>
  );
};

// --- Main App Router Switch ---

const AppContent = () => {
  const { path, params } = useRouter();

  // Simple Routing Logic
  if (path === '/' || path === '') {
    return <HomePage />;
  }

  if (path.startsWith('/category/')) {
    const id = params.id || path.split('/')[2];
    return <CategoryPage categoryId={id} />;
  }

  if (path.startsWith('/tool/')) {
    const id = params.id || path.split('/')[2];
    return <ToolPage toolId={id} />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">404</h1>
      <p className="text-slate-500">Page not found</p>
      <Button onClick={() => window.location.hash = '/'}>Go Home</Button>
    </div>
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