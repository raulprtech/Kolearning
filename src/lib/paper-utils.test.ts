import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchPapers, searchArxiv, getOpenAccessPdf, fetchPaperAbstract } from './paper-utils';

// Global fetch mock
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('paper-utils', () => {
    beforeEach(() => {
        fetchMock.mockClear();
    });

    describe('searchPapers', () => {
        it('should return papers from Semantic Scholar', async () => {
            const mockResponse = {
                data: [
                    {
                        title: 'Test Paper',
                        authors: [{ name: 'Author A' }],
                        year: 2023,
                        externalIds: { DOI: '10.1234/test' },
                        url: 'https://example.com',
                        openAccessPdf: { url: 'https://example.com/pdf' },
                        abstract: 'Test abstract',
                        venue: 'Test Venue',
                    },
                ],
            };

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const results = await searchPapers('test query');
            expect(results).toHaveLength(1);
            expect(results[0].title).toBe('Test Paper');
            expect(results[0].source).toBe('Semantic Scholar');
        });

        it('should fallback to ArXiv if Semantic Scholar fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Internal Server Error',
            });

            // Mock ArXiv response
            fetchMock.mockResolvedValueOnce({
                ok: true,
                text: async () => '<entry><title>ArXiv Paper</title><summary>Summary</summary><id>http://arxiv.org/abs/1234.5678</id></entry>',
            });

            const results = await searchPapers('test query');
            expect(results[0].title).toBe('ArXiv Paper');
            expect(results[0].source).toBe('ArXiv');
        });
    });

    describe('getOpenAccessPdf', () => {
        it('should return PDF URL from Unpaywall', async () => {
            const mockResponse = {
                best_oa_location: { url_for_pdf: 'https://example.com/free.pdf' },
            };

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const url = await getOpenAccessPdf('10.1234/test');
            expect(url).toBe('https://example.com/free.pdf');
        });

        it('should return null if Unpaywall fails', async () => {
            fetchMock.mockResolvedValueOnce({ ok: false });
            const url = await getOpenAccessPdf('10.1234/test');
            expect(url).toBe(null);
        });
    });

    describe('fetchPaperAbstract', () => {
        it('should return abstract from Semantic Scholar', async () => {
            const mockResponse = {
                data: [{ abstract: 'Fetched abstract' }],
            };

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const abstract = await fetchPaperAbstract('Test Title');
            expect(abstract).toBe('Fetched abstract');
        });
    });
});
