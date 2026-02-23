CREATE TABLE IF NOT EXISTS document_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Untitled Template',
    description TEXT DEFAULT '',
    fields JSONB DEFAULT '[]'::jsonb,
    roles JSONB DEFAULT '[]'::jsonb,
    chamber_id UUID NOT NULL REFERENCES chambers(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast chamber-based lookups
CREATE INDEX IF NOT EXISTS idx_document_templates_chamber_id ON document_templates(chamber_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_created_by ON document_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_document_templates_status ON document_templates(status);

-- RLS policies
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Chamber members can read templates from their chamber
CREATE POLICY "Chamber members can read templates"
    ON document_templates FOR SELECT
    USING (
        chamber_id IN (
            SELECT chamber_id FROM chamber_members
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Chamber admins can create templates
CREATE POLICY "Chamber admins can create templates"
    ON document_templates FOR INSERT
    WITH CHECK (
        chamber_id IN (
            SELECT chamber_id FROM chamber_members
            WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Chamber admins can update templates in their chamber
CREATE POLICY "Chamber admins can update templates"
    ON document_templates FOR UPDATE
    USING (
        chamber_id IN (
            SELECT chamber_id FROM chamber_members
            WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Chamber admins can delete templates in their chamber
CREATE POLICY "Chamber admins can delete templates"
    ON document_templates FOR DELETE
    USING (
        chamber_id IN (
            SELECT chamber_id FROM chamber_members
            WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );
