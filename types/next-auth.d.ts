import 'next-auth';
import { DefaultRoles } from '@/utils/permissions';

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: DefaultRoles;  // Add the role property here
    }
  }
}







