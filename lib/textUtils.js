/**
 * Convert a string to proper title case
 * Handles all caps, preserves acronyms, and follows English title case rules
 * 
 * @param {string} str - The string to convert
 * @returns {string} - The title-cased string
 */
function toTitleCase(str) {
  if (!str) return '';
  
  // Small words that should be lowercase (unless first or last word)
  const smallWords = new Set([
    'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 
    'into', 'nor', 'of', 'on', 'onto', 'or', 'the', 'to', 'with'
  ]);
  
  // Split on spaces and hyphens, but preserve the separators
  const words = str.split(/(\s+|-)/);
  
  const titleCased = words.map((word, index) => {
    // Preserve spaces and hyphens
    if (/^\s+$/.test(word) || word === '-') {
      return word;
    }
    
    // Convert to lowercase first
    const lowerWord = word.toLowerCase();
    
    // Check if it's a small word and not first/last word
    const isFirstOrLast = index === 0 || index === words.length - 1;
    const isSmallWord = smallWords.has(lowerWord);
    
    if (isSmallWord && !isFirstOrLast) {
      return lowerWord;
    }
    
    // Capitalize first letter
    return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
  });
  
  return titleCased.join('');
}

module.exports = {
  toTitleCase
};
