
import { createSupabaseBrowserClient } from './client';

const supabase = createSupabaseBrowserClient();

export const uploadFile = async (file: File, path: string) => {
  const { data, error } = await supabase.storage.from('uploads').upload(path, file);
  if (error) {
    throw error;
  }
  return data;
};

export const getFileUrl = async (path: string) => {
  const { data } = await supabase.storage.from('uploads').getPublicUrl(path);
  return data.publicUrl;
};
