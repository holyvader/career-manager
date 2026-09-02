import { edenServer } from '@/lib/eden-server';

export async function getSession() {
  const { data } = await edenServer.auth.session.get();
  return data ?? null;
}
