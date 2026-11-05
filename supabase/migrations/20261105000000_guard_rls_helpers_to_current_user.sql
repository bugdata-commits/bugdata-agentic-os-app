-- RLS helpers must never reveal membership or roles for an arbitrary user ID.
-- Preserve the existing signatures and grants so current policies continue to work;
-- callers that supply another identity receive false/NULL instead.

CREATE OR REPLACE FUNCTION private.is_workspace_member(
  target_workspace_id uuid,
  target_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT CASE
    WHEN target_user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.workspace_members AS wm
      WHERE wm.workspace_id = target_workspace_id
        AND wm.user_id = auth.uid()
    )
  END;
$function$;

REVOKE ALL ON FUNCTION private.is_workspace_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_workspace_member(uuid, uuid) TO authenticated;
COMMENT ON FUNCTION private.is_workspace_member(uuid, uuid) IS
  'RLS helper restricted to auth.uid(); authenticated callers cannot inspect another user membership.';

CREATE OR REPLACE FUNCTION private.workspace_role(
  target_workspace_id uuid,
  target_user_id uuid DEFAULT auth.uid()
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT CASE
    WHEN target_user_id IS DISTINCT FROM auth.uid() THEN NULL
    ELSE (
      SELECT wm.role
      FROM public.workspace_members AS wm
      WHERE wm.workspace_id = target_workspace_id
        AND wm.user_id = auth.uid()
      LIMIT 1
    )
  END;
$function$;

REVOKE ALL ON FUNCTION private.workspace_role(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.workspace_role(uuid, uuid) TO authenticated;
COMMENT ON FUNCTION private.workspace_role(uuid, uuid) IS
  'RLS helper restricted to auth.uid(); authenticated callers cannot inspect another user workspace role.';
