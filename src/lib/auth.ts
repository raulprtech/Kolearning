import { createSupabaseServerClient } from './supabase/client';

export const getUser = async () => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return data.user;
};