-- Idempotent authenticated workspace onboarding for the existing RLS policies.
CREATE OR REPLACE FUNCTION public.bugdata_ensure_workspace_for_current_user(workspace_name text)
RETURNS public.workspaces
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_user_id uuid := auth.uid();
  found_workspace public.workspaces;
  normalized_name text := pg_catalog.left(pg_catalog.btrim(CASE WHEN workspace_name IS NULL THEN '' ELSE workspace_name END), 160);
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'An authenticated Supabase user is required' USING ERRCODE = '28000';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(current_user_id::text), 48291);

  SELECT w.*
  INTO found_workspace
  FROM public.workspace_members AS wm
  JOIN public.workspaces AS w ON w.id = wm.workspace_id
  WHERE wm.user_id = current_user_id
  ORDER BY wm.created_at ASC, w.created_at ASC
  LIMIT 1;
  IF FOUND THEN
    RETURN found_workspace;
  END IF;

  SELECT w.*
  INTO found_workspace
  FROM public.workspaces AS w
  WHERE w.owner_id = current_user_id
  ORDER BY w.created_at ASC
  LIMIT 1;
  IF FOUND THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (found_workspace.id, current_user_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
    RETURN found_workspace;
  END IF;

  IF normalized_name = '' THEN
    normalized_name := 'My workspace';
  END IF;

  INSERT INTO public.workspaces (owner_id, name, slug)
  VALUES (
    current_user_id,
    normalized_name,
    'workspace-' || pg_catalog.replace(current_user_id::text, '-', '')
  )
  RETURNING * INTO found_workspace;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (found_workspace.id, current_user_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RETURN found_workspace;
END;
$function$;

REVOKE ALL ON FUNCTION public.bugdata_ensure_workspace_for_current_user(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bugdata_ensure_workspace_for_current_user(text) TO authenticated;
