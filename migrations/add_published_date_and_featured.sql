-- Migration: Add published_date and is_featured to patents table
-- This allows you to control which patent is featured and display your publish date

-- Add published_date column (when YOU publish the analysis)
ALTER TABLE patents 
ADD COLUMN published_date TIMESTAMP WITHOUT TIME ZONE;

-- Add is_featured flag (to control which patent shows on homepage)
ALTER TABLE patents 
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;

-- Add index for featured patents
CREATE INDEX idx_patents_featured ON patents(is_featured) WHERE is_featured = TRUE;

-- Add index for published_date
CREATE INDEX idx_patents_published_date ON patents(published_date DESC);

-- Add comment
COMMENT ON COLUMN patents.published_date IS 'Date when the analysis was published on the website';
COMMENT ON COLUMN patents.is_featured IS 'Whether this patent should be featured on the homepage';
