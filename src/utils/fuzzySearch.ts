/**
 * Fuzzy search utility for matching text with typo tolerance
 */

/**
 * Calculate the Levenshtein distance between two strings
 * This measures the minimum number of single-character edits needed to transform one string into another
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize the matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if a word fuzzy matches the target with a given threshold
 */
function fuzzyMatchWord(searchWord: string, targetWord: string, threshold: number = 0.3): boolean {
  // Exact match or contains
  if (targetWord.includes(searchWord)) {
    return true;
  }

  // For very short words, require exact match or contains
  if (searchWord.length <= 2) {
    return targetWord.includes(searchWord);
  }

  // Calculate distance and normalize by the longer string length
  const distance = levenshteinDistance(searchWord, targetWord);
  const maxLength = Math.max(searchWord.length, targetWord.length);
  const similarity = 1 - distance / maxLength;

  return similarity >= (1 - threshold);
}

/**
 * Check if any word in the target starts with the search word (prefix matching)
 */
function prefixMatch(searchWord: string, targetWords: string[]): boolean {
  return targetWords.some(word => word.startsWith(searchWord));
}

/**
 * Fuzzy match a search query against a target text
 * Returns true if the query fuzzy matches the target
 */
export function fuzzyMatch(query: string, target: string): boolean {
  if (!query || !target) return false;

  const queryLower = query.toLowerCase().trim();
  const targetLower = target.toLowerCase();

  // Direct contains check first (fastest)
  if (targetLower.includes(queryLower)) {
    return true;
  }

  // Split into words for word-level matching
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  const targetWords = targetLower.split(/\s+/).filter(w => w.length > 0);

  // Check if all query words match (either by prefix, contains, or fuzzy)
  return queryWords.every(queryWord => {
    // Check prefix match first
    if (prefixMatch(queryWord, targetWords)) {
      return true;
    }

    // Check contains in any word
    if (targetWords.some(tw => tw.includes(queryWord))) {
      return true;
    }

    // Fuzzy match against any target word
    return targetWords.some(targetWord => fuzzyMatchWord(queryWord, targetWord));
  });
}

/**
 * Calculate a relevance score for sorting search results
 * Higher score = better match
 */
export function fuzzyScore(query: string, target: string): number {
  if (!query || !target) return 0;

  const queryLower = query.toLowerCase().trim();
  const targetLower = target.toLowerCase();

  // Exact match gets highest score
  if (targetLower === queryLower) {
    return 100;
  }

  // Starts with query gets high score
  if (targetLower.startsWith(queryLower)) {
    return 90;
  }

  // Contains exact query
  if (targetLower.includes(queryLower)) {
    return 80;
  }

  // Word-level matching
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  const targetWords = targetLower.split(/\s+/).filter(w => w.length > 0);

  let totalScore = 0;
  let matchedWords = 0;

  for (const queryWord of queryWords) {
    let bestWordScore = 0;

    for (const targetWord of targetWords) {
      // Exact word match
      if (targetWord === queryWord) {
        bestWordScore = Math.max(bestWordScore, 70);
      }
      // Word starts with query word
      else if (targetWord.startsWith(queryWord)) {
        bestWordScore = Math.max(bestWordScore, 60);
      }
      // Word contains query word
      else if (targetWord.includes(queryWord)) {
        bestWordScore = Math.max(bestWordScore, 50);
      }
      // Fuzzy match
      else if (queryWord.length > 2) {
        const distance = levenshteinDistance(queryWord, targetWord);
        const maxLength = Math.max(queryWord.length, targetWord.length);
        const similarity = 1 - distance / maxLength;
        if (similarity >= 0.7) {
          bestWordScore = Math.max(bestWordScore, similarity * 40);
        }
      }
    }

    if (bestWordScore > 0) {
      matchedWords++;
      totalScore += bestWordScore;
    }
  }

  // Average score based on matched words
  if (matchedWords === 0) return 0;
  return (totalScore / queryWords.length) * (matchedWords / queryWords.length);
}
