
CREATE OR REPLACE FUNCTION public.validate_investment_transaction()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    v_committed numeric;
    v_contributed numeric;
    v_new_contributed numeric;
    v_status text;
    v_allocated numeric;
BEGIN
    SELECT
        committed_amount,
        status
    INTO
        v_committed,
        v_status
    FROM public.investments
    WHERE id = NEW.investment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Investment not found';
    END IF;

    -- Enforce investment lifecycle rules at database level.
    IF v_status = 'cancelled' THEN
        RAISE EXCEPTION
            'Transactions are not allowed for cancelled investments.';
    ELSIF v_status = 'refunded' THEN
        RAISE EXCEPTION
            'Transactions are not allowed for refunded investments.';
    ELSIF v_status = 'completed'
       AND NEW.type = 'contribution' THEN
        RAISE EXCEPTION
            'Contributions are not allowed for completed investments.';
    END IF;

    -- Calculate net contributed capital.
    v_contributed :=
        public.get_investment_contributed_amount(NEW.investment_id);

    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'contribution' THEN
            v_new_contributed := v_contributed + NEW.amount;
        ELSIF NEW.type = 'refund' THEN
            v_new_contributed := v_contributed - NEW.amount;
        ELSE
            v_new_contributed := v_contributed;
        END IF;
    ELSE
        -- Preserve the existing UPDATE balance calculation.
        IF OLD.type = 'contribution' THEN
            v_new_contributed := v_contributed - OLD.amount;
        ELSIF OLD.type = 'refund' THEN
            v_new_contributed := v_contributed + OLD.amount;
        ELSE
            v_new_contributed := v_contributed;
        END IF;

        IF NEW.type = 'contribution' THEN
            v_new_contributed := v_new_contributed + NEW.amount;
        ELSIF NEW.type = 'refund' THEN
            v_new_contributed := v_new_contributed - NEW.amount;
        END IF;
    END IF;

    IF v_new_contributed < 0 THEN
        RAISE EXCEPTION
            'Investment contribution balance cannot be negative';
    END IF;

    IF v_new_contributed > v_committed THEN
        RAISE EXCEPTION
            'Investment contributions (%) cannot exceed committed amount (%)',
            v_new_contributed,
            v_committed;
    END IF;

    v_allocated :=
        public.get_investment_allocated_amount(NEW.investment_id);

    IF v_allocated > v_new_contributed THEN
        RAISE EXCEPTION
            'Investment allocations cannot exceed contributed amount (%)',
            v_allocated;
    END IF;

    RETURN NEW;
END;
$function$;
