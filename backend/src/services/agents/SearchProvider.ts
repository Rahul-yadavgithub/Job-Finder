export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchProvider {
  /**
   * Search the web for a given query and return a list of URLs and snippets.
   * @param query The search string
   * @param limit Maximum number of results to return
   */
  search(query: string, limit?: number): Promise<SearchResult[]>;
}
