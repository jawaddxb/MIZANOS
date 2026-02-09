"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import { documentsRepository } from "@/lib/api/repositories";
import type { ProductDocument, DocumentFolder } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, FileText, FileX, Search, FolderPlus, Upload, Home, ChevronRight, Trash2, Eye } from "lucide-react";

interface DocumentsListProps {
  productId: string;
  onUploadClick: () => void;
}

const CATEGORIES = [
  { value: "all", label: "All" }, { value: "design", label: "Design" },
  { value: "requirements", label: "Requirements" }, { value: "screenshots", label: "Screenshots" },
  { value: "contracts", label: "Contracts" }, { value: "reports", label: "Reports" },
  { value: "general", label: "General" },
] as const;

function useDocuments(productId: string) {
  return useQuery({
    queryKey: ["documents", productId],
    queryFn: async (): Promise<ProductDocument[]> => {
      const result = await documentsRepository.getByProduct(productId, { sortBy: "created_at", sortOrder: "desc" });
      return result.data;
    },
    enabled: !!productId,
  });
}

function useFolders(productId: string) {
  return useQuery({
    queryKey: ["document-folders", productId],
    queryFn: (): Promise<DocumentFolder[]> => documentsRepository.getFolders(productId),
    enabled: !!productId,
  });
}

function FolderCard({ folder, docCount, subfolderCount, onOpen }: { folder: DocumentFolder; docCount: number; subfolderCount: number; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left w-full">
      <FolderOpen className="h-8 w-8 text-primary shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{folder.name}</p>
        <p className="text-xs text-muted-foreground">{docCount} docs, {subfolderCount} folders</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function DocumentRow({ document: doc }: { document: ProductDocument }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{doc.file_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {doc.category && <Badge variant="secondary" className="text-[10px]">{doc.category}</Badge>}
          <span className="text-xs text-muted-foreground">{(doc.file_size / 1024).toFixed(1)} KB</span>
          <span className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</span>
        </div>
        {doc.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{doc.description}</p>}
      </div>
    </div>
  );
}

function DocumentsList({ productId, onUploadClick }: DocumentsListProps) {
  const { data: documents, isLoading: docsLoading } = useDocuments(productId);
  const { data: folders, isLoading: foldersLoading } = useFolders(productId);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const isLoading = docsLoading || foldersLoading;

  const currentSubfolders = useMemo(() => folders?.filter((f) => f.parent_id === currentFolderId) ?? [], [folders, currentFolderId]);
  const currentDocuments = useMemo(() => documents?.filter((doc) => (doc.folder_id ?? null) === currentFolderId) ?? [], [documents, currentFolderId]);

  const filteredDocuments = useMemo(() => currentDocuments.filter((doc) => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || doc.category === categoryFilter;
    return matchesSearch && matchesCat;
  }), [currentDocuments, searchQuery, categoryFilter]);

  const filteredFolders = useMemo(() => currentSubfolders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())), [currentSubfolders, searchQuery]);

  const getFolderCounts = (fid: string) => ({
    docCount: documents?.filter((d) => d.folder_id === fid).length ?? 0,
    subfolderCount: folders?.filter((f) => f.parent_id === fid).length ?? 0,
  });

  const breadcrumbs = useMemo(() => {
    const trail: DocumentFolder[] = [];
    let id = currentFolderId;
    while (id) {
      const folder = folders?.find((f) => f.id === id);
      if (!folder) break;
      trail.unshift(folder);
      id = folder.parent_id;
    }
    return trail;
  }, [folders, currentFolderId]);

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => setCurrentFolderId(null)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><Home className="h-4 w-4" />Root</button>
        {breadcrumbs.map((folder) => (
          <span key={folder.id} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <button onClick={() => setCurrentFolderId(folder.id)} className="text-muted-foreground hover:text-foreground">{folder.name}</button>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="text-sm border rounded-md px-3 py-2 bg-background">
          {CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
        </select>
        <Button variant="outline" size="sm" leftIcon={<FolderPlus className="h-4 w-4" />}>New Folder</Button>
        <Button size="sm" leftIcon={<Upload className="h-4 w-4" />} onClick={onUploadClick}>Upload</Button>
      </div>

      {filteredFolders.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Folders</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFolders.map((folder) => {
              const counts = getFolderCounts(folder.id);
              return <FolderCard key={folder.id} folder={folder} docCount={counts.docCount} subfolderCount={counts.subfolderCount} onOpen={() => setCurrentFolderId(folder.id)} />;
            })}
          </div>
        </div>
      )}

      {filteredDocuments.length > 0 && (
        <div className="space-y-2">
          {filteredFolders.length > 0 && <h4 className="text-sm font-medium text-muted-foreground">Documents</h4>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredDocuments.map((doc) => <DocumentRow key={doc.id} document={doc} />)}
          </div>
        </div>
      )}

      {filteredFolders.length === 0 && filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-1">{currentFolderId ? "Empty Folder" : "No Documents"}</h3>
            <p className="text-sm text-muted-foreground mb-4">{searchQuery || categoryFilter !== "all" ? "No items match your filters" : "Upload your first document or create a folder to get started"}</p>
            {!searchQuery && categoryFilter === "all" && <Button leftIcon={<Upload className="h-4 w-4" />} onClick={onUploadClick}>Upload Document</Button>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { DocumentsList };
export type { DocumentsListProps };
