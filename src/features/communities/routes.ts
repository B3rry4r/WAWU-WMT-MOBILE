import type { useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

/** The room screen (I25) for a community id. */
export function openRoom(router: Router, id: string) {
  router.push({ pathname: '/community/[id]', params: { id } });
}
