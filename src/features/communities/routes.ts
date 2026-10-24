import type { useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

/** The room screen (I25) for a community id. */
export function openRoom(router: Router, id: string) {
  router.push({ pathname: '/community/[id]', params: { id } });
}

/** I30 and I31: a private room's monthly pass (INBOX-14, R-63), for a person who is not in it yet, or whose pass is ending. */
export function openPass(router: Router, id: string) {
  router.push({ pathname: '/community/pass/[id]', params: { id } });
}
