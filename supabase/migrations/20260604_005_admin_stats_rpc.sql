-- Create RPC for Admin Overview Stats to avoid fetching all rows
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_students INT;
  active_users INT;
  pending_users INT;
  total_resources INT;
  total_papers INT;
  total_rooms INT;
  resource_bytes BIGINT;
  paper_bytes BIGINT;
BEGIN
  SELECT count(*) INTO active_students FROM public.profiles WHERE role = 'student' AND status = 'active';
  SELECT count(*) INTO active_users FROM public.profiles WHERE status = 'active';
  SELECT count(*) INTO pending_users FROM public.profiles WHERE status = 'pending';
  
  SELECT count(*), COALESCE(SUM(file_size), 0) INTO total_resources, resource_bytes FROM public.resources;
  SELECT count(*), COALESCE(SUM(file_size), 0) INTO total_papers, paper_bytes FROM public.exam_papers;
  
  SELECT count(*) INTO total_rooms FROM public.rooms;

  RETURN json_build_object(
    'active_students', active_students,
    'active_users', active_users,
    'pending_users', pending_users,
    'total_resources', total_resources,
    'total_papers', total_papers,
    'total_rooms', total_rooms,
    'total_storage_bytes', resource_bytes + paper_bytes
  );
END;
$$;
