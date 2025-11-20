export enum CategoryId {
  DOCUMENTS = 'documents',
  IMAGES = 'images',
  AUDIO = 'audio',
  VIDEO = 'video',
  ARCHIVES = 'archives',
  ADVANCED = 'advanced'
}

export interface Tool {
  id: string;
  title: string;
  description: string;
  categoryId: CategoryId;
  icon: string; // Name of the lucide icon
  popular?: boolean;
}

export interface Category {
  id: CategoryId;
  title: string;
  description: string;
  icon: string;
  color: string;
  textColor: string;
}

export interface Route {
  path: string;
  params?: Record<string, string>;
}