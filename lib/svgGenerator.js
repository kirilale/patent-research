/**
 * SVG Patent Scorecard Generator
 * Generates 1200x630px scorecard images for patents
 */

function generatePatentScorecard(patentData) {
    const {
        title = 'Patent Title',
        company = 'Company Name',
        patentNumber = '00000000',
        scores = {}
    } = patentData;

    // Default scores if not provided
    const defaultScores = {
        gaming_relevance: scores.gaming_relevance || 0,
        innovation: scores.innovation || 0,
        commercial_viability: scores.commercial_viability || 0,
        disruptiveness: scores.disruptiveness || 0,
        feasibility: scores.feasibility || 0,
        patent_strength: scores.patent_strength || 0
    };

    // Wrap title text to fit in 2 lines max
    const wrapText = (text, maxWidth = 50) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) lines.push(currentLine);
        return lines.slice(0, 2); // Max 2 lines
    };

    const titleLines = wrapText(title);
    
    // Bar colors - Meaningful colors matching each metric
    const barColors = [
        '#22c55e', // Green for Gaming Relevance (positive, relevant)
        '#3b82f6', // Blue for Innovation (creative, forward-thinking)
        '#f59e0b', // Amber for Commercial Viability (money, value)
        '#ef4444', // Red for Disruptiveness (bold, breaking norms)
        '#8b5cf6', // Purple for Feasibility (practical, achievable)
        '#64748b'  // Slate for Patent Strength (solid, legal)
    ];

    const leftPadding = 100;
    const rightPadding = 100;
    const barWidth = 650;
    const startY = titleLines.length > 1 ? 260 : 240; // More breathing room after company
    
    // Only include scores that exist (filter out Patent Strength if it's 0)
    const allScores = [
        { label: 'Gaming Relevance', score: defaultScores.gaming_relevance, color: barColors[0] },
        { label: 'Innovation', score: defaultScores.innovation, color: barColors[1] },
        { label: 'Commercial Viability', score: defaultScores.commercial_viability, color: barColors[2] },
        { label: 'Disruptiveness', score: defaultScores.disruptiveness, color: barColors[3] },
        { label: 'Feasibility', score: defaultScores.feasibility, color: barColors[4] }
    ];
    
    // Add Patent Strength only if it has a value
    if (defaultScores.patent_strength > 0) {
        allScores.push({ label: 'Patent Strength', score: defaultScores.patent_strength, color: barColors[5] });
    }
    
    const scorePositions = allScores.map((item, index) => ({
        ...item,
        y: startY + (index * 65) // Fill vertical space evenly
    }));

    // Generate score bars
    let scoreBars = '';
    scorePositions.forEach(item => {
        const width = (item.score / 100) * barWidth;
        scoreBars += `
            <text x="${leftPadding}" y="${item.y}" fill="#000" font-size="17" font-weight="500" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">${item.label}</text>
            <rect x="320" y="${item.y - 16}" width="${barWidth}" height="32" rx="6" fill="#e0e0e0"/>
            <rect x="320" y="${item.y - 16}" width="${width}" height="32" rx="6" fill="${item.color}"/>
            <text x="${1200 - rightPadding}" y="${item.y + 5}" fill="#000" font-size="24" font-weight="700" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">${item.score}</text>
        `;
    });

    // Escape special characters in text
    const escapeXml = (str) => {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    const safeCompany = escapeXml(company);
    const safePatentNumber = escapeXml(patentNumber);
    
    // Generate title lines (company now above title)
    let titleSvg = '';
    titleLines.forEach((line, index) => {
        const safeLine = escapeXml(line);
        const yPos = 140 + (index * 48);
        titleSvg += `<text x="${leftPadding}" y="${yPos}" fill="#000" font-size="42" font-weight="700" letter-spacing="-0.02em" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">${safeLine}</text>\n    `;
    });

    // Generate complete SVG
    return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <!-- White background -->
    <rect width="1200" height="630" fill="#ffffff"/>
    
    <!-- Border -->
    <rect x="0" y="0" width="1200" height="630" fill="none" stroke="#e0e0e0" stroke-width="1"/>
    
    <!-- Patent number at top -->
    <text x="${leftPadding}" y="50" fill="#999" font-size="14" font-weight="500" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">Patent ${safePatentNumber}</text>
    
    <!-- Company (below patent, above title) -->
    <text x="${leftPadding}" y="80" fill="#666" font-size="17" font-weight="400" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">${safeCompany}</text>
    
    <!-- Title -->
    ${titleSvg}
    
    <!-- Score bars -->
    ${scoreBars}
</svg>`;
}

module.exports = {
    generatePatentScorecard
};
