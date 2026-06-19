import { supabase } from '../../../config/supabase';

export class UserRepository {
  async findByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'communication_tpr')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error; // Not found error is PGRST116
    }
    return data;
  }

  async updateTokenVersion(userId: string) {
    const { data, error } = await supabase.rpc('increment_token_version', { user_id: userId });
    
    if (error) {
      // Fallback if RPC doesn't exist
      const { data: user } = await supabase.from('users').select('token_version').eq('id', userId).single();
      const newVersion = (user?.token_version || 0) + 1;
      const { error: updateError } = await supabase
        .from('users')
        .update({ token_version: newVersion })
        .eq('id', userId);
      if (updateError) throw updateError;
      return newVersion;
    }
    return data;
  }
}
