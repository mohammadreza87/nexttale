/**
 * File Browser Panel Component
 * Middle panel showing file tree and search in Code view
 */

import { useState } from 'react';
import { FolderTree, Search } from 'lucide-react';
import { FileTree } from '../FileTree';
import type { FileNode } from '../../types';

interface FileBrowserPanelProps {
  files: FileNode[];
  selectedFile: string | null;
  onSelectFile: (file: string | null) => void;
}

export function FileBrowserPanel({
  files,
  selectedFile,
  onSelectFile,
}: FileBrowserPanelProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'search'>('files');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter files based on search query
  const filterFiles = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query.trim()) return nodes;

    const lowerQuery = query.toLowerCase();
    return nodes.reduce<FileNode[]>((acc, node) => {
      if (node.type === 'file') {
        if (node.name.toLowerCase().includes(lowerQuery)) {
          acc.push(node);
        }
      } else if (node.children) {
        const filteredChildren = filterFiles(node.children, query);
        if (filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren });
        }
      }
      return acc;
    }, []);
  };

  const displayedFiles = activeTab === 'search' && searchQuery
    ? filterFiles(files, searchQuery)
    : files;

  return (
    <div className="flex w-64 flex-col border-r border-gray-800 bg-gray-900">
      {/* Tab buttons */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('files')}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'files'
              ? 'border-b-2 border-violet-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FolderTree className="h-4 w-4" />
          Files
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'search'
              ? 'border-b-2 border-violet-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>

      {/* Search input */}
      <div className="p-2">
        <input
          type="text"
          placeholder="Search files"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none ring-violet-500/50 focus:ring-1"
        />
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-auto">
        <FileTree
          files={displayedFiles}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
        />
      </div>
    </div>
  );
}
