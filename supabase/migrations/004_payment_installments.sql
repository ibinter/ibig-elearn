-- ============================================================
-- Migration 004 : Paiement en 3 fois
-- ============================================================

CREATE TABLE public.payment_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  enrollment_id uuid REFERENCES public.enrollments(id),
  installment_number integer NOT NULL CHECK (installment_number IN (1, 2, 3)),
  total_amount integer NOT NULL,
  installment_amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  due_date timestamptz NOT NULL,
  paid_at timestamptz,
  payment_id uuid REFERENCES public.payments(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','cancelled')),
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, installment_number)
);

ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Utilisateur voit ses échéances" ON public.payment_installments
  FOR SELECT USING (user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','coordinateur')));
CREATE POLICY "Insertion échéances (service)" ON public.payment_installments
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Mise à jour échéances (service)" ON public.payment_installments
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','coordinateur'))
  );

CREATE INDEX IF NOT EXISTS idx_installments_user_course ON public.payment_installments (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_installments_due ON public.payment_installments (due_date, status);
