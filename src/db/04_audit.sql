-- ============================================================================
-- 04_audit.sql  |  Auditoría de cambios
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  op         TEXT NOT NULL,            -- INSERT | UPDATE | DELETE
  row_pk     TEXT,
  user_app   TEXT,                     -- set_config('ema.user','<id>',false) desde backend
  at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  old_data   JSONB,
  new_data   JSONB
);

CREATE OR REPLACE FUNCTION trg_audit_row()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_user TEXT;
BEGIN
  v_user := current_setting('ema.user', true);
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log(table_name, op, row_pk, user_app, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, COALESCE((NEW).id::text, NULL), v_user, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log(table_name, op, row_pk, user_app, old_data, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, COALESCE((NEW).id::text, NULL), v_user, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log(table_name, op, row_pk, user_app, old_data)
    VALUES (TG_TABLE_NAME, TG_OP, COALESCE((OLD).id::text, NULL), v_user, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['User','Address','Kid','Course','Schedule','Booking','Feedback','Payment','Payment_item']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON %I', t, t);
    EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON %I
                    FOR EACH ROW EXECUTE FUNCTION trg_audit_row()', t, t);
  END LOOP;
END $$;

COMMIT;