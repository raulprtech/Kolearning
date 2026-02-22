"use server";

import { Paper } from "@/contexts/ProjectContext";

export type SearchResult = {
    title: string;
    authors: string[];
    year: number | null;
    doi: string | null;
    url: string | null;
    pdfUrl: string | null;
    fieldOfKnowledge?: string;
    abstract?: string;
    venue?: string;
};

/**
 * Searches for papers using the Semantic Scholar API.
 */
export async function searchPapers(query: string): Promise<SearchResult[]> {
    if (!query) return [];

    try {
        const response = await fetch(
            `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
                query
            )}&limit=10&fields=title,authors,year,externalIds,url,openAccessPdf,abstract,venue`,
            {
                next: { revalidate: 3600 }, // Cache search for 1 hour
            }
        );

        if (!response.ok) {
            throw new Error(`Semantic Scholar API error: ${response.statusText}`);
        }

        const data = await response.json();

        return (data.data || []).map((paper: any) => ({
            title: paper.title,
            authors: paper.authors?.map((a: any) => a.name) || [],
            year: paper.year,
            doi: paper.externalIds?.DOI || null,
            url: paper.url,
            pdfUrl: paper.openAccessPdf?.url || null,
            abstract: paper.abstract,
            venue: paper.venue,
        }));
    } catch (error) {
        console.error("Error searching papers:", error);
        throw error;
    }
}

/**
 * Checks Unpaywall for a free PDF if Semantic Scholar didn't find one.
 */
export async function getOpenAccessPdf(doi: string): Promise<string | null> {
    if (!doi) return null;

    try {
        // Note: Unpaywall requires an email parameter
        const response = await fetch(
            `https://api.unpaywall.org/v2/${doi}?email=support@kolearning.com`
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data.best_oa_location?.url_for_pdf || null;
    } catch (error) {
        console.error("Error checking Unpaywall:", error);
        return null;
    }
}

/**
 * Fetches only the abstract for a paper using its title (and optionally DOI)
 */
export async function fetchPaperAbstract(title: string, doi?: string): Promise<string | null> {
    try {
        const query = doi || title;
        if (!query) return null;

        const response = await fetch(
            `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=1&fields=abstract`,
            { next: { revalidate: 3600 } }
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data.data?.[0]?.abstract || null;
    } catch (error) {
        console.error("Error fetching paper abstract:", error);
        return null;
    }
}
