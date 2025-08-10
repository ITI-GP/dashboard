import { supabase } from "@/providers/supabaseClient";

// Fetch a single user by ID
export const fetchUserById = async (id: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// Update user data
export const updateUser = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Fetch all roles (you might want to customize this based on your roles system)
export const fetchRoles = async () => {
  // This is a placeholder - adjust based on your roles system
  return [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
    { value: 'moderator', label: 'Moderator' },
  ];
};
