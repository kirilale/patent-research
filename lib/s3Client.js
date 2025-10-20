/**
 * AWS S3 Client for Patent Scorecard Images
 */

const { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'patent-uploads';
const FOLDER_PREFIX = 'patent-images/';

/**
 * Check if a file exists in S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>}
 */
async function fileExists(key) {
    try {
        const command = new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });
        await s3Client.send(command);
        return true;
    } catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        throw error;
    }
}

/**
 * Upload SVG to S3
 * @param {string} patentNumber - Patent number for filename
 * @param {string} svgContent - SVG content as string
 * @returns {Promise<string>} - Public URL of uploaded file
 */
async function uploadPatentScorecard(patentNumber, svgContent) {
    const key = `${FOLDER_PREFIX}${patentNumber}.svg`;
    
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: svgContent,
        ContentType: 'image/svg+xml',
        CacheControl: 'public, max-age=31536000' // Cache for 1 year
        // Note: Bucket must have public access configured via bucket policy
    });

    await s3Client.send(command);

    // Return public URL
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-central-1'}.amazonaws.com/${key}`;
}

/**
 * Get public URL for a patent scorecard
 * @param {string} patentNumber - Patent number
 * @returns {string} - Public URL
 */
function getPatentScorecardUrl(patentNumber) {
    const key = `${FOLDER_PREFIX}${patentNumber}.svg`;
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-central-1'}.amazonaws.com/${key}`;
}

/**
 * Check if patent scorecard exists in S3
 * @param {string} patentNumber - Patent number
 * @returns {Promise<boolean>}
 */
async function patentScorecardExists(patentNumber) {
    const key = `${FOLDER_PREFIX}${patentNumber}.svg`;
    return await fileExists(key);
}

/**
 * Download patent scorecard from S3
 * @param {string} patentNumber - Patent number
 * @returns {Promise<string>} - SVG content as string
 */
async function downloadPatentScorecard(patentNumber) {
    const key = `${FOLDER_PREFIX}${patentNumber}.svg`;
    
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });

    const response = await s3Client.send(command);
    
    // Convert stream to string
    const chunks = [];
    for await (const chunk of response.Body) {
        chunks.push(chunk);
    }
    
    return Buffer.concat(chunks).toString('utf-8');
}

module.exports = {
    uploadPatentScorecard,
    getPatentScorecardUrl,
    patentScorecardExists,
    downloadPatentScorecard,
    s3Client
};
