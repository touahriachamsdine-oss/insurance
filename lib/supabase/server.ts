import { getCurrentUser } from '@/lib/auth-utils';

export async function createServerClient() {
  return {
    auth: {
      async getUser() {
        const user = await getCurrentUser();
        if (!user) {
          return { data: { user: null }, error: { message: 'Not authenticated' } };
        }
        return {
          data: {
            user: {
              id: user.id,
              email: user.email,
              user_metadata: {
                full_name_ar: user.full_name_ar,
                full_name_en: user.full_name_en,
                role: user.role,
                company_id: user.company_id,
                is_active: user.is_active
              }
            }
          },
          error: null
        };
      }
    }
  };
}
