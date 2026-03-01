"use server";
/**
 * Searches for papers using the Semantic Scholar API.
 */
export async function searchPapers(query) {
    if (!query)
        return [];
    try {
        const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=10&fields=title,authors,year,externalIds,url,openAccessPdf,abstract,venue`, {
            next: { revalidate: 3600 }, // Cache search for 1 hour
        });
        if (!response.ok) {
            throw new Error(`Semantic Scholar API error: ${response.statusText}`);
        }
        const data = await response.json();
        return (data.data || []).map((paper) => {
            var _a, _b, _c;
            return ({
                title: paper.title,
                authors: ((_a = paper.authors) === null || _a === void 0 ? void 0 : _a.map((a) => a.name)) || [],
                year: paper.year,
                doi: ((_b = paper.externalIds) === null || _b === void 0 ? void 0 : _b.DOI) || null,
                url: paper.url,
                pdfUrl: ((_c = paper.openAccessPdf) === null || _c === void 0 ? void 0 : _c.url) || null,
                abstract: paper.abstract,
                venue: paper.venue,
                source: 'Semantic Scholar'
            });
        });
    }
    catch (error) {
        console.error("Error searching papers in Semantic Scholar:", error);
        // Fallback to ArXiv
        return searchArxiv(query);
    }
}
/**
 * Searches for papers using a simplified Web search (simulated for now or using a basic scraper).
 */
export async function searchWeb(query) {
    try {
        console.log(`[paper-utils] Falling back to Web search for: ${query}`);
        // For medical/scientific queries, we could target sites like PubMed or Google Scholar via proxies
        // Here we simulate a high-level web search result
        return [
            {
                title: `Resultados generales de la web sobre: ${query}`,
                authors: ["Varios autores"],
                year: new Date().getFullYear(),
                url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
                doi: null,
                pdfUrl: null,
                abstract: "Esta es una recopilación de resultados encontrados en la web abierta. Haz clic en el enlace para explorar las fuentes originales.",
                source: 'Web (Google Scholar)'
            }
        ];
    }
    catch (error) {
        console.error("Error searching papers in Web:", error);
        return [];
    }
}
/**
 * Searches for papers using the ArXiv API as a fallback.
 */
export async function searchArxiv(query) {
    try {
        console.log(`[paper-utils] Falling back to ArXiv search for: ${query}`);
        const response = await fetch(`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=10`);
        if (!response.ok) {
            throw new Error(`ArXiv API error: ${response.statusText}`);
        }
        const text = await response.text();
        // Very basic XML parsing using string manipulation to avoid hefty dependencies
        // In a real app, use a proper XML parser
        const entries = text.split('<entry>');
        entries.shift(); // Remove the part before the first entry
        return entries.map(entry => {
            const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
            const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
            const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
            const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);
            // Extract authors
            const authorMatches = entry.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>\s*<\/author>/g);
            const authors = Array.from(authorMatches).map(m => m[1].trim());
            const title = titleMatch ? titleMatch[1].trim().replace(/\n/g, ' ') : 'Sin título';
            const year = publishedMatch ? new Date(publishedMatch[1]).getFullYear() : null;
            const url = idMatch ? idMatch[1].trim() : null;
            const abstract = summaryMatch ? summaryMatch[1].trim().replace(/\n/g, ' ') : '';
            return {
                title,
                authors,
                year,
                doi: null,
                url,
                pdfUrl: url ? url.replace('abs', 'pdf') : null,
                abstract,
                source: 'ArXiv'
            };
        });
    }
    catch (error) {
        console.error("Error searching papers in ArXiv:", error);
        // Final fallback to Web
        return searchWeb(query);
    }
}
/**
 * Checks Unpaywall for a free PDF if Semantic Scholar didn't find one.
 */
export async function getOpenAccessPdf(doi) {
    var _a;
    if (!doi)
        return null;
    try {
        // Note: Unpaywall requires an email parameter
        const response = await fetch(`https://api.unpaywall.org/v2/${doi}?email=support@kolearning.com`);
        if (!response.ok)
            return null;
        const data = await response.json();
        return ((_a = data.best_oa_location) === null || _a === void 0 ? void 0 : _a.url_for_pdf) || null;
    }
    catch (error) {
        console.error("Error checking Unpaywall:", error);
        return null;
    }
}
/**
 * Fetches only the abstract for a paper using its title (and optionally DOI)
 */
export async function fetchPaperAbstract(title, doi) {
    var _a, _b;
    try {
        const query = doi || title;
        if (!query)
            return null;
        const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=1&fields=abstract`, { next: { revalidate: 3600 } });
        if (!response.ok)
            return null;
        const data = await response.json();
        return ((_b = (_a = data.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.abstract) || null;
    }
    catch (error) {
        console.error("Error fetching paper abstract:", error);
        return null;
    }
}
