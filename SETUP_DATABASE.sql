-- Rx Relief Pharmacy - Database Schema Setup
-- Run this script in Supabase SQL Editor: https://app.supabase.com/project/qhszupmhhschvbuxywuo/sql

-- ============================================================================
-- 1. CREATE PROFILES TABLE (User profiles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. CREATE TRIGGER FUNCTION FOR NEW USERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'phone')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 3. CREATE MEDICINES TABLE (Product catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  pack_size TEXT,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.medicines TO anon;
GRANT SELECT ON public.medicines TO authenticated;
GRANT ALL ON public.medicines TO service_role;

ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Catalog is public" ON public.medicines;
CREATE POLICY "Catalog is public" ON public.medicines FOR SELECT TO anon, authenticated USING (true);

-- ============================================================================
-- 4. CREATE ORDERS TABLE (Customer orders)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'placed',
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  prescription_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. CREATE ORDER ITEMS TABLE (Line items in orders)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders ON DELETE CASCADE,
  medicine_id UUID REFERENCES public.medicines ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users insert own order items" ON public.order_items;
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Users insert own order items" ON public.order_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- ============================================================================
-- 6. STORAGE POLICIES FOR PRESCRIPTIONS
-- ============================================================================
DROP POLICY IF EXISTS "Users upload own prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Users read own prescriptions" ON storage.objects;
CREATE POLICY "Users upload own prescriptions" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'prescriptions' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own prescriptions" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'prescriptions' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- 7. SEED MEDICINES DATA
-- ============================================================================
-- Delete existing data first (if running multiple times)
DELETE FROM public.medicines WHERE name IN (
  'Paracetamol 500mg', 'Ibuprofen 200mg', 'Cetirizine 10mg', 'Loratadine 10mg',
  'Vitamin D3 1000 IU', 'Vitamin C 1000mg', 'Oral Rehydration Salts', 'Antacid Suspension',
  'Cough Syrup', 'Saline Nasal Spray', 'Digital Thermometer', 'Blood Pressure Monitor',
  'Amoxicillin 500mg', 'Azithromycin 250mg', 'Metformin 500mg', 'Insulin Glargine',
  'Amlodipine 5mg', 'Salbutamol Inhaler'
);

INSERT INTO public.medicines (name, brand, category, description, price, pack_size, requires_prescription, stock) VALUES
('Paracetamol 500mg', 'Calpol', 'Pain Relief', 'Relieves mild to moderate pain and reduces fever.', 2.49, '20 tablets', false, 240),
('Ibuprofen 200mg', 'Brufen', 'Pain Relief', 'Anti-inflammatory for headaches, muscle pain and fever.', 3.99, '24 tablets', false, 180),
('Cetirizine 10mg', 'Zyrtec', 'Allergy', 'Non-drowsy antihistamine for hay fever and allergies.', 4.25, '30 tablets', false, 150),
('Loratadine 10mg', 'Claritin', 'Allergy', 'Once-daily relief from allergy symptoms.', 4.75, '30 tablets', false, 120),
('Vitamin D3 1000 IU', 'HealthAid', 'Vitamins', 'Supports bone health and immune function.', 6.50, '60 capsules', false, 200),
('Vitamin C 1000mg', 'Redoxon', 'Vitamins', 'Effervescent tablets to support immunity.', 5.20, '20 tablets', false, 160),
('Oral Rehydration Salts', 'Dioralyte', 'Digestive Health', 'Restores fluids and electrolytes after dehydration.', 5.99, '12 sachets', false, 90),
('Antacid Suspension', 'Gaviscon', 'Digestive Health', 'Fast relief from heartburn and indigestion.', 7.40, '300 ml', false, 110),
('Cough Syrup', 'Benylin', 'Cold & Flu', 'Soothes dry, tickly coughs.', 6.80, '150 ml', false, 95),
('Saline Nasal Spray', 'Sterimar', 'Cold & Flu', 'Gently clears blocked noses. Suitable for all ages.', 8.10, '50 ml', false, 70),
('Digital Thermometer', 'Omron', 'Devices', 'Fast, accurate underarm and oral readings.', 12.99, '1 unit', false, 45),
('Blood Pressure Monitor', 'Omron', 'Devices', 'Upper-arm automatic monitor with memory.', 39.90, '1 unit', false, 25),
('Amoxicillin 500mg', 'Amoxil', 'Antibiotics', 'Broad-spectrum antibiotic for bacterial infections.', 9.60, '21 capsules', true, 80),
('Azithromycin 250mg', 'Zithromax', 'Antibiotics', 'Short-course antibiotic for respiratory infections.', 14.20, '6 tablets', true, 60),
('Metformin 500mg', 'Glucophage', 'Diabetes', 'First-line therapy for type 2 diabetes.', 8.35, '60 tablets', true, 100),
('Insulin Glargine', 'Lantus', 'Diabetes', 'Long-acting basal insulin pen. Cold-chain shipped.', 45.00, '3 ml pen', true, 30),
('Amlodipine 5mg', 'Norvasc', 'Cardiac Care', 'Lowers blood pressure and prevents angina.', 7.90, '30 tablets', true, 85),
('Salbutamol Inhaler', 'Ventolin', 'Respiratory', 'Reliever inhaler for asthma and wheezing.', 11.50, '200 doses', true, 65);

-- ============================================================================
-- 8. REVOKE DANGEROUS PERMISSIONS
-- ============================================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- VERIFICATION: Check if everything was created successfully
-- ============================================================================
-- Run these queries to verify:
-- SELECT COUNT(*) as medicine_count FROM public.medicines;
-- SELECT * FROM public.medicines LIMIT 5;
