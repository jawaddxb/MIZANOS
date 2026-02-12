"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Skeleton } from "@/components/atoms/display/Skeleton";
import { Button } from "@/components/molecules/buttons/Button";
import { documentsRepository } from "@/lib/api/repositories";
import type { ProductDocument, DocumentFolder } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import {
  FolderOpen, FileText, FileX, Search, FolderPlus, Upload,
  Home, ChevronRight, Pencil, History, Trash2, Link2, Globe,
} from "lucide-react";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { EditDocumentDialog } from "./EditDocumentDialog";
import { VersionHistoryDialog } from "./VersionHistoryDialog";
import { RenameFolderDialog } from "./RenameFolderDialog";
import { AccessLinksTab } from "./AccessLinksTab";
import { ExternalDocsTab } from "./ExternalDocsTab";
import { useDeleteFolder } from "@/hooks/mutations/useDocumentFolderMutations";

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

const DOC_TABS = [
  { id: "files", label: "Files", icon: FileText },
  { id: "external", label: "External Docs", icon: Globe },
  { id: "access-links", label: "Access Links", icon: Link2 },
] as const;

type DocTabId = (typeof DOC_TABS)[number]["id"];

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

function DocumentsList({ productId, onUploadClick }: DocumentsListProps) {
  const { data: documents, isLoading: docsLoading } = useDocuments(productId);
  const { data: folders, isLoading: foldersLoading } = useFolders(productId);
  const deleteFolder = useDeleteFolder(productId);
  const [activeDocTab, setActiveDocTab] = useState<DocTabId>("files");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<ProductDocument | null>(null);
  const [editDocOpen, setEditDocOpen] = useState(false);
  const [versionDocId, setVersionDocId] = useState<string>("");
  const [versionOpen, setVersionOpen] = useState(false);
  const [renameFolder, setRenameFolder] = useState<DocumentFolder | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);

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
      <div className="flex gap-1 border-b">
        {DOC_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveDocTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeDocTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon className="h-4 w-4" />{tab.label}
            </button>
          );
        })}
      </div>

      {activeDocTab === "external" ? (
        <ExternalDocsTab productId={productId} />
      ) : activeDocTab === "access-links" ? (
        <AccessLinksTab productId={productId} />
      ) : (
        <>
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
            <Button variant="outline" size="sm" leftIcon={<FolderPlus className="h-4 w-4" />} onClick={() => setFolderDialogOpen(true)}>New Folder</Button>
            <Button size="sm" leftIcon={<Upload className="h-4 w-4" />} onClick={onUploadClick}>Upload</Button>
          </div>

          {filteredFolders.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Folders</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredFolders.map((folder) => {
                  const counts = getFolderCounts(folder.id);
                  return (
                    <FolderCard key={folder.id} folder={folder} docCount={counts.docCount} subfolderCount={counts.subfolderCount}
                      onOpen={() => setCurrentFolderId(folder.id)}
                      onRename={() => { setRenameFolder(folder); setRenameOpen(true); }}
                      onDelete={() => deleteFolder.mutate(folder.id)} />
                  );
                })}
              </div>
            </div>
          )}

          {filteredDocuments.length > 0 && (
            <div className="space-y-2">
              {filteredFolders.length > 0 && <h4 className="text-sm font-medium text-muted-foreground">Documents</h4>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredDocuments.map((doc) => (
                  <DocumentRow key={doc.id} document={doc}
                    onEdit={() => { setEditDoc(doc); setEditDocOpen(true); }}
                    onVersionHistory={() => { setVersionDocId(doc.id); setVersionOpen(true); }} />
                ))}
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

          <CreateFolderDialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen} productId={productId} parentId={currentFolderId} />
          <EditDocumentDialog open={editDocOpen} onOpenChange={setEditDocOpen} document={editDoc} />
          <VersionHistoryDialog open={versionOpen} onOpenChange={setVersionOpen} documentId={versionDocId} />
          <RenameFolderDialog open={renameOpen} onOpenChange={setRenameOpen} folder={renameFolder} productId={productId} />
        </>
      )}
    </div>
  );
}

function FolderCard({ folder, docCount, subfolderCount, onOpen, onRename, onDelete }: {
  folder: DocumentFolder; docCount: number; subfolderCount: number; onOpen: () => void; onRename: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <button onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <FolderOpen className="h-8 w-8 text-primary shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{folder.name}</p>
          <p className="text-xs text-muted-foreground">{docCount} docs, {subfolderCount} folders</p>
        </div>
      </button>
      <div className="flex items-center gap-0.5 shrink-0">
        <button onClick={onRename} className="p-1 rounded hover:bg-accent" title="Rename"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-destructive/10" title="Delete"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
}

function DocumentRow({ document: doc, onEdit, onVersionHistory }: { document: ProductDocument; onEdit: () => void; onVersionHistory: () => void }) {
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
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded hover:bg-accent" title="Edit document"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
        <button onClick={onVersionHistory} className="p-1.5 rounded hover:bg-accent" title="Version history"><History className="h-3.5 w-3.5 text-muted-foreground" /></button>
      </div>
    </div>
  );
}

export { DocumentsList };
export type { DocumentsListProps };
