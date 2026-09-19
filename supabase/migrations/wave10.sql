-- Wave 10: testimonials table

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_role text NOT NULL,
  author_country text DEFAULT '',
  content text NOT NULL,
  rating smallint DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  initials text DEFAULT '',
  color text DEFAULT 'bg-blue-600',
  is_published boolean DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'testimonials' AND policyname = 'published testimonials are public') THEN
    CREATE POLICY "published testimonials are public" ON testimonials FOR SELECT USING (is_published = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'testimonials' AND policyname = 'admins manage testimonials') THEN
    CREATE POLICY "admins manage testimonials" ON testimonials FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','coordinateur')))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','coordinateur')));
  END IF;
END $$;

-- Seed initial testimonials
INSERT INTO testimonials (author_name, author_role, author_country, content, rating, initials, color, is_published, position) VALUES
('Kouassi Ange-Brice', 'Directeur Commercial', 'Côte d''Ivoire', 'IBIG E-LEARN m''a permis de me certifier en marketing digital sans quitter Abidjan. La qualité des formateurs et les cas pratiques africains font toute la différence.', 5, 'KA', 'bg-blue-600', true, 1),
('Fatou Diallo', 'Responsable RH', 'Sénégal', 'J''ai obtenu ma certification GRH en 3 mois tout en travaillant à temps plein. Le paiement en Orange Money et le contenu téléchargeable m''ont énormément facilité la vie.', 5, 'FD', 'bg-green-600', true, 2),
('Moussa Traoré', 'Entrepreneur', 'Mali', 'La formation en comptabilité SYSCOHADA est exactement ce qu''il me fallait pour gérer ma PME. Les formateurs connaissent les réalités du marché africain.', 5, 'MT', 'bg-orange-600', true, 3)
ON CONFLICT DO NOTHING;
