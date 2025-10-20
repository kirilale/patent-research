/**
 * Patent Scorecard Image API
 * Generates and serves SVG scorecard images for patents
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../lib/db');
const { generatePatentScorecard } = require('../lib/svgGenerator');
const { 
    uploadPatentScorecard, 
    getPatentScorecardUrl, 
    patentScorecardExists,
    downloadPatentScorecard
} = require('../lib/s3Client');

/**
 * GET /api/patent-card/:patentNumber.svg
 * Generates or retrieves a patent scorecard image
 */
router.get('/:patentNumber.svg', async (req, res) => {
    try {
        const patentNumber = req.params.patentNumber;

        // Validate patent number format
        if (!patentNumber || !/^[A-Z0-9]+$/.test(patentNumber)) {
            return res.status(400).send('Invalid patent number');
        }

        // Check if scorecard already exists in S3
        const exists = await patentScorecardExists(patentNumber);
        
        if (exists) {
            // Fetch from S3 and serve directly
            const svgContent = await downloadPatentScorecard(patentNumber);
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
            return res.send(svgContent);
        }

        // Fetch patent data from database with assignees and scores from ai_analysis_deep
        const result = await pool.query(
            `SELECT 
                p.patent_number,
                p.title,
                ad.scores,
                ARRAY_AGG(a.assignee_name ORDER BY pa.sequence_order) FILTER (WHERE a.assignee_name IS NOT NULL) as assignees
            FROM patents p
            LEFT JOIN patent_assignees pa ON p.patent_id = pa.patent_id
            LEFT JOIN assignees a ON pa.assignee_id = a.assignee_id
            LEFT JOIN ai_analysis_deep ad ON p.patent_id = ad.patent_id
            WHERE p.patent_number = $1
            GROUP BY p.patent_id, p.patent_number, p.title, ad.scores`,
            [patentNumber]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('Patent not found');
        }

        const patent = result.rows[0];
        
        // Prepare data for SVG generation
        const scores = patent.scores || {};
        const patentData = {
            title: patent.title || 'Patent Title',
            company: (patent.assignees && patent.assignees.length > 0) 
                ? patent.assignees.filter(a => a !== null).join(', ') 
                : 'Company Name',
            patentNumber: patent.patent_number,
            scores: {
                gaming_relevance: scores.gaming_relevance_score || 0,
                innovation: scores.innovation_score || 0,
                commercial_viability: scores.commercial_viability_score || 0,
                disruptiveness: scores.disruptiveness_score || 0,
                feasibility: scores.implementation_feasibility_score || 0,
                patent_strength: scores.patent_strength_score || 0
            }
        };

        // Generate SVG
        const svgContent = generatePatentScorecard(patentData);

        // Upload to S3 for caching
        await uploadPatentScorecard(patentNumber, svgContent);

        // Serve the SVG directly
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.send(svgContent);

    } catch (error) {
        console.error('Error generating patent scorecard:', error);
        
        // Return a simple error SVG instead of failing completely
        const errorSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
            <rect width="1200" height="630" fill="#f3f4f6"/>
            <text x="600" y="315" fill="#6b7280" font-size="24" text-anchor="middle" font-family="sans-serif">
                Error generating scorecard
            </text>
        </svg>`;
        
        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(errorSvg);
    }
});

/**
 * POST /api/patent-card/:patentNumber/regenerate
 * Force regeneration of a patent scorecard (clears cache)
 */
router.post('/:patentNumber/regenerate', async (req, res) => {
    try {
        const patentNumber = req.params.patentNumber;

        // Validate patent number
        if (!patentNumber || !/^[A-Z0-9]+$/.test(patentNumber)) {
            return res.status(400).json({ error: 'Invalid patent number' });
        }

        // Fetch patent data with assignees and scores from ai_analysis_deep
        const result = await pool.query(
            `SELECT 
                p.patent_number,
                p.title,
                ad.scores,
                ARRAY_AGG(a.assignee_name ORDER BY pa.sequence_order) FILTER (WHERE a.assignee_name IS NOT NULL) as assignees
            FROM patents p
            LEFT JOIN patent_assignees pa ON p.patent_id = pa.patent_id
            LEFT JOIN assignees a ON pa.assignee_id = a.assignee_id
            LEFT JOIN ai_analysis_deep ad ON p.patent_id = ad.patent_id
            WHERE p.patent_number = $1
            GROUP BY p.patent_id, p.patent_number, p.title, ad.scores`,
            [patentNumber]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Patent not found' });
        }

        const patent = result.rows[0];
        
        // Prepare data
        const scores = patent.scores || {};
        const patentData = {
            title: patent.title || 'Patent Title',
            company: (patent.assignees && patent.assignees.length > 0) 
                ? patent.assignees.filter(a => a !== null).join(', ') 
                : 'Company Name',
            patentNumber: patent.patent_number,
            scores: {
                gaming_relevance: scores.gaming_relevance_score || 0,
                innovation: scores.innovation_score || 0,
                commercial_viability: scores.commercial_viability_score || 0,
                disruptiveness: scores.disruptiveness_score || 0,
                feasibility: scores.implementation_feasibility_score || 0,
                patent_strength: scores.patent_strength_score || 0
            }
        };

        // Generate and upload (will overwrite existing)
        const svgContent = generatePatentScorecard(patentData);
        const s3Url = await uploadPatentScorecard(patentNumber, svgContent);

        res.json({ 
            success: true, 
            url: s3Url,
            message: 'Scorecard regenerated successfully'
        });

    } catch (error) {
        console.error('Error regenerating patent scorecard:', error);
        res.status(500).json({ error: 'Failed to regenerate scorecard' });
    }
});

module.exports = router;
