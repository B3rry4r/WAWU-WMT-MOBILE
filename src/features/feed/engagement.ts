import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { follow, recordView, setLiked, setSaved, type FeedItem } from './api';

/**
 * The viewer's own marks on a post: like, save and follow, drawn at once and put right by
 * the Hub's answer (or put back when the Hub refuses), plus the one view the feed counts
 * when the post fills the screen.
 */
export function useEngagement(item: FeedItem, active: boolean) {
  const [liked, setLikedState] = useState(item.likedByMe);
  const [likes, setLikes] = useState(item.likes);
  const [saved, setSavedState] = useState(item.savedByMe);
  const [follows, setFollows] = useState(item.followsCreator);

  const like = useMutation({
    mutationFn: (next: boolean) => setLiked(item.id, next),
    onSuccess: (state) => {
      setLikedState(state.likedByMe);
      setLikes(state.likes);
    },
    onError: (_error, next) => {
      setLikedState(!next);
      setLikes((n) => Math.max(0, n + (next ? -1 : 1)));
    },
  });
  const save = useMutation({
    mutationFn: (next: boolean) => setSaved(item.id, next),
    onError: (_error, next) => setSavedState(!next),
  });
  const followCreator = useMutation({
    mutationFn: () => follow(item.creatorWawuId),
    onSuccess: (following) => setFollows(following),
    onError: () => setFollows(false),
  });

  const view = useMutation({ mutationFn: () => recordView(item.id) });
  const counted = useRef(false);
  const countView = view.mutate;
  useEffect(() => {
    if (!active || counted.current) return;
    counted.current = true;
    countView();
  }, [active, countView]);

  return {
    liked,
    likes,
    saved,
    follows,
    toggleLike: () => {
      if (like.isPending) return;
      const next = !liked;
      setLikedState(next);
      setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
      like.mutate(next);
    },
    toggleSave: () => {
      if (save.isPending) return;
      const next = !saved;
      setSavedState(next);
      save.mutate(next);
    },
    followCreator: () => {
      if (followCreator.isPending || follows) return;
      setFollows(true);
      followCreator.mutate();
    },
  };
}
