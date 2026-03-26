export interface WikiComment {
  id: string;
  content: string;
  authorEmail: string;
  authorName: string;
  createdAt: string;
}

export interface WikiPage {
  id: string;
  title: string;
  content: string; // Markdown content
  parentId: string | null; // null for root pages
  order: number; // For ordering siblings
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  comments: WikiComment[];
  children?: WikiPage[]; // Populated client-side for tree structure
}
