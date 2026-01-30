
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'type') THEN
        ALTER TABLE fields ADD COLUMN "type" text DEFAULT 'signature';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'label') THEN
        ALTER TABLE fields ADD COLUMN "label" text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'required') THEN
        ALTER TABLE fields ADD COLUMN "required" boolean DEFAULT true;
    END IF;
END $$;
