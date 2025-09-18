declare module 'pdf-parse' {
  interface PDFInfo {
    numpages?: number;
    numrender?: number;
    info?: Record<string, any>;
    metadata?: any;
    version?: string;
  }
  interface PDFParseResult {
    text: string;
    info?: PDFInfo;
    metadata?: any;
    version?: string;
  }
  function pdfParse(dataBuffer: Buffer | Uint8Array, options?: Record<string, any>): Promise<PDFParseResult>;
  export default pdfParse;
}
