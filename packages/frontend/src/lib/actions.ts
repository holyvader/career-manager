'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { edenServer } from '@/lib/eden-server';

export async function logout() {
  await edenServer.auth.signOut.post();

  // The backend's cookie-clearing Set-Cookie headers only reach this
  // server-to-server call, not the browser - clear them here too so the
  // response back to the browser actually drops the session.
  const cookieStore = await cookies();
  cookieStore.delete('better-auth.session_token');
  cookieStore.delete('better-auth.session_data');
  cookieStore.delete('better-auth.dont_remember');

  redirect('/enter');
}
