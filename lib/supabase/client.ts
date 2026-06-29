export function createBrowserClient() {
  return {
    auth: {
      async signInWithPassword({ email, password }: any) {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            return { data: null, error: { message: data.message || 'Login failed' } };
          }
          return { data, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message || 'Login failed' } };
        }
      },
      async signUp({ email, password, options }: any) {
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              password,
              fullNameAr: options?.data?.full_name_ar,
              fullNameEn: options?.data?.full_name_en,
              role: options?.data?.role,
              companyId: options?.data?.company_id,
              nationalId: options?.data?.national_id,
              phone: options?.data?.phone,
              wilayaCode: options?.data?.wilaya_code,
              companyNameAr: options?.data?.company_name_ar,
              companyNameEn: options?.data?.company_name_en,
              companyCode: options?.data?.company_code,
              licenseNumber: options?.data?.license_number,
              headquartersWilaya: options?.data?.headquarters_wilaya,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            return { data: null, error: { message: data.message || 'Registration failed' } };
          }
          return { data, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message || 'Registration failed' } };
        }
      },
      async signOut() {
        try {
          const res = await fetch('/api/auth/logout', { method: 'POST' });
          if (!res.ok) {
            return { error: { message: 'Sign out failed' } };
          }
          return { error: null };
        } catch (err: any) {
          return { error: { message: err.message || 'Sign out failed' } };
        }
      },
      async getUser() {
        try {
          const res = await fetch('/api/auth/me');
          const data = await res.json();
          if (!res.ok) {
            return { data: { user: null }, error: { message: 'User not found' } };
          }
          return { data: { user: data.user }, error: null };
        } catch {
          return { data: { user: null }, error: null };
        }
      }
    }
  };
}
