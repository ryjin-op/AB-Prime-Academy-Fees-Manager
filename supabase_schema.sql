-- Students Table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_url TEXT,
    name TEXT NOT NULL,
    father_name TEXT,
    mother_name TEXT,
    guardian_phone TEXT,
    guardian_whatsapp TEXT,
    address TEXT,
    dob DATE,
    phone TEXT,
    whatsapp TEXT,
    class TEXT,
    semester TEXT,
    monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    advance_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_due NUMERIC(10, 2) NOT NULL DEFAULT 0,
    admission_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' -- active, inactive
);

-- Admins Table (Profiles linked to Auth)
CREATE TABLE public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'Staff Admin', -- Super Admin, Staff Admin, Accountant
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments Table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_type TEXT DEFAULT 'monthly_fee', -- monthly_fee, advance, admission_fee, one-time
    month_for DATE, -- The month this payment is for (start of month date)
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    created_by_admin UUID REFERENCES auth.users(id)
);

-- Logs Table (Audit Ledger)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    activity TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security Definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple Policies (Admin only access)
CREATE POLICY "Admins can do everything on students" ON public.students FOR ALL USING (public.is_admin());
CREATE POLICY "Profiles are viewable by owner or admin" ON public.admin_profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admins can do everything on payments" ON public.payments FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view logs" ON public.audit_logs FOR SELECT USING (public.is_admin());

-- Function to handle monthly dues (This can be called via a Cron job or a Webhook)
CREATE OR REPLACE FUNCTION generate_monthly_dues()
RETURNS void AS $$
DECLARE
    student_record RECORD;
    new_due NUMERIC;
    new_advance NUMERIC;
BEGIN
    FOR student_record IN SELECT * FROM public.students WHERE status = 'active'
    LOOP
        -- Logic: If advance exists, deduct from advance, else add to due.
        IF student_record.advance_balance >= student_record.monthly_fee THEN
            -- Full payment from advance
            UPDATE public.students 
            SET advance_balance = advance_balance - monthly_fee
            WHERE id = student_record.id;
            
            -- Log the auto-payment
            INSERT INTO public.payments (student_id, amount, payment_type, month_for, payment_date)
            VALUES (student_record.id, student_record.monthly_fee, 'advance_adjustment', date_trunc('month', CURRENT_DATE), NOW());
        ELSE
            -- Partial or no advance
            new_due = student_record.monthly_fee - student_record.advance_balance;
            UPDATE public.students 
            SET total_due = total_due + new_due,
                advance_balance = 0
            WHERE id = student_record.id;

            IF student_record.advance_balance > 0 THEN
                 INSERT INTO public.payments (student_id, amount, payment_type, month_for, payment_date)
                 VALUES (student_record.id, student_record.advance_balance, 'advance_adjustment', date_trunc('month', CURRENT_DATE), NOW());
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to process a manual payment
CREATE OR REPLACE FUNCTION process_payment(p_student_id UUID, p_amount NUMERIC, p_admin_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
    v_total_due NUMERIC;
    v_advance_balance NUMERIC;
    v_excess NUMERIC;
    v_paid_from_due NUMERIC;
BEGIN
    -- Get current status
    SELECT total_due, advance_balance INTO v_total_due, v_advance_balance 
    FROM public.students WHERE id = p_student_id;

    IF p_amount <= v_total_due THEN
        -- Pay toward due
        UPDATE public.students 
        SET total_due = total_due - p_amount,
            updated_at = NOW()
        WHERE id = p_student_id;
        v_paid_from_due = p_amount;
        v_excess = 0;
    ELSE
        -- Pay all due, rest goes to advance
        v_excess = p_amount - v_total_due;
        UPDATE public.students 
        SET total_due = 0,
            advance_balance = advance_balance + v_excess,
            updated_at = NOW()
        WHERE id = p_student_id;
        v_paid_from_due = v_total_due;
    END IF;

    -- Record in payments table
    INSERT INTO public.payments (student_id, amount, payment_type, month_for, payment_date, created_by_admin)
    VALUES (p_student_id, p_amount, 'fee_payment', date_trunc('month', CURRENT_DATE), NOW(), p_admin_id);

    -- Log activity
    INSERT INTO public.audit_logs (admin_id, activity, details)
    VALUES (p_admin_id, 'Payment Processed', jsonb_build_object(
        'student_id', p_student_id, 
        'amount', p_amount, 
        'paid_towards_due', v_paid_from_due, 
        'added_to_advance', v_excess
    ));
END;
$$ LANGUAGE plpgsql;
