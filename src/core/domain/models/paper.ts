export type PaperStatus = 'in_box' | 'assigned' | 'processing' | 'ready';
export type PDFStatus = 'available' | 'pending' | 'not_available';
export type ImportSource = 'ArXiv' | 'BibTeX' | 'DOI' | 'manual' | 'Zotero';
export type ReadingStatus = 'unread' | 'in_progress' | 'read';
export type PaperPriority = 'high' | 'medium' | 'low';
export type DifficultyLevel = 'basic' | 'intermediate' | 'advanced';
export type PaperType = 'survey' | 'experimental' | 'theoretical' | 'review';

export type Paper = {
    id: string;
    title: string;
    authors: string[];
    year?: number;
    doi?: string;
    journalConference?: string;
    url?: string;
    pdfStatus: PDFStatus;
    importSource: ImportSource;
    status: PaperStatus;
    processingPercentage: number;
    fieldOfKnowledge?: string;
    difficultyLevel?: DifficultyLevel;
    paperType?: PaperType;
    tags: string[];
    readingStatus: ReadingStatus;
    notes?: string;
    priority: PaperPriority;
    lastInteraction: string;
    projectId?: string; // Project ID it belongs to
    createdAt: string;
};
