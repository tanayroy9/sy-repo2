ALTER TABLE public.business_plans ADD COLUMN IF NOT EXISTS trial_granted_at timestamptz;
UPDATE public.business_plans SET trial_granted_at = COALESCE(created_at, now()) WHERE trial_granted_at IS NULL AND (plan_kind = 'full' OR trial_ends_at IS NOT NULL);

CREATE OR REPLACE FUNCTION public.set_business_plan_kind(_business_id uuid, _kind text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_plan public.business_plans%ROWTYPE;
  v_days int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = _business_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Kun virksomhedens ejer kan ændre abonnementstypen.';
  END IF;
  IF _kind NOT IN ('listing','full') THEN
    RAISE EXCEPTION 'Ugyldig plantype.';
  END IF;
  PERFORM set_config('app.plan_kind_rpc', '1', true);
  SELECT * INTO v_plan FROM public.business_plans WHERE business_id = _business_id FOR UPDATE;
  SELECT trial_days INTO v_days FROM public.platform_settings WHERE id = 1;
  v_days := LEAST(GREATEST(COALESCE(v_days, 30), 0), 365);

  IF v_plan.id IS NULL THEN
    INSERT INTO public.business_plans (business_id, plan_kind, status, trial_ends_at, monthly_price_dkk, route_planning_enabled, trial_granted_at)
    VALUES (_business_id, _kind,
            CASE WHEN _kind = 'full' THEN 'trialing' ELSE 'active' END,
            CASE WHEN _kind = 'full' THEN now() + make_interval(days => v_days) END, 0, _kind = 'full',
            CASE WHEN _kind = 'full' THEN now() END);
  ELSIF v_plan.plan_kind <> _kind THEN
    IF _kind = 'full' THEN
      -- Prøveperioden gives kun én gang pr. virksomhed; et skift frem og tilbage forlænger den ikke.
      UPDATE public.business_plans
         SET plan_kind = 'full', status = 'trialing', route_planning_enabled = true,
             trial_ends_at = CASE WHEN v_plan.trial_granted_at IS NULL THEN now() + make_interval(days => v_days)
                                  ELSE LEAST(now(), v_plan.trial_granted_at + make_interval(days => v_days)) END,
             trial_granted_at = COALESCE(v_plan.trial_granted_at, now()),
             updated_at = now()
       WHERE id = v_plan.id;
    ELSE
      IF v_plan.stripe_subscription_id IS NOT NULL AND v_plan.status IN ('active','trialing','past_due') THEN
        RAISE EXCEPTION 'Opsig først dit betalte abonnement, før du skifter til Kun profil.';
      END IF;
      IF EXISTS (SELECT 1 FROM public.routes WHERE business_id = _business_id AND route_date >= current_date AND COALESCE(status,'') NOT IN ('archived','completed')) THEN
        RAISE EXCEPTION 'Du har planlagte ruter. Afslut eller slet dem først, før du skifter til Kun profil.';
      END IF;
      IF EXISTS (SELECT 1 FROM public.agreements WHERE business_id = _business_id AND status IN ('active','paused','pending_approval')) THEN
        RAISE EXCEPTION 'Du har aktive aftaler. Afslut dem først, før du skifter til Kun profil.';
      END IF;
      UPDATE public.business_plans
         SET plan_kind = 'listing', status = 'active', trial_ends_at = NULL, monthly_price_dkk = 0,
             route_planning_enabled = false, accounting_integration_enabled = false, extra_employee_logins = 0, updated_at = now()
       WHERE id = v_plan.id;
    END IF;
  END IF;
  PERFORM set_config('app.plan_kind_rpc', '', true);
  RETURN jsonb_build_object('plan_kind', _kind);
END $function$;

DO $$
DECLARE v_tok text;
BEGIN
  SELECT token INTO v_tok FROM internal.cron_tokens WHERE id = 1;
  IF v_tok IS NULL THEN RAISE EXCEPTION 'cron token missing'; END IF;
  PERFORM cron.unschedule('seo-engine-daily');
  PERFORM cron.unschedule('seo-engine-extra-slots');
  PERFORM cron.schedule('seo-engine-daily', '0 6 * * *', format($c$
    SELECT net.http_post(url := 'https://gkectsellkpltrxvusot.supabase.co/functions/v1/seo-engine',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer %s'),
      body := '{"action":"tick"}'::jsonb, timeout_milliseconds := 150000);
  $c$, v_tok));
  PERFORM cron.schedule('seo-engine-extra-slots', '30 0,9,12,15,18,21 * * *', format($c$
    SELECT net.http_post(url := 'https://gkectsellkpltrxvusot.supabase.co/functions/v1/seo-engine',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer %s'),
      body := '{"action":"tick"}'::jsonb, timeout_milliseconds := 150000);
  $c$, v_tok));
END $$;