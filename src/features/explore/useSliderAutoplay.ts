import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { AccessibilityInfo, AppState, type ScrollView } from 'react-native';

/**
 * How the Explore slider moves by itself (R-116, owner, 31 Oct 2026: "Ads should be sliding automatically"). Lead defaults, owner
 * may override: every 5 seconds, the same animated slide as a swipe, and after the last slide back to the first.
 */
export const sliderAutoMetrics = {
  /** How long a slide stays before the next one slides in, and how long after a finger lifts before it starts again. */
  everyMs: 5000,
  /** The longest the slide back to the first is allowed to hold back the views of the slides it passes. */
  rewindMs: 1000,
} as const;

const m = sliderAutoMetrics;

/** The app is in front. iOS also says `inactive` (a call, the control centre); neither moves a slide. */
const inFront = (state: unknown) => state !== 'background' && state !== 'inactive';

function useInFront(): boolean {
  const [front, setFront] = useState(() => inFront(AppState.currentState));
  useEffect(() => {
    const watch = AppState.addEventListener('change', (state) => setFront(inFront(state)));
    return () => watch?.remove?.();
  }, []);
  return front;
}

/**
 * The phone's reduce-motion setting. Until the phone has answered, and if it cannot, the slider is treated as reduced: nothing moves
 * by itself without the phone having said motion is fine.
 */
function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let live = true;
    void Promise.resolve(AccessibilityInfo.isReduceMotionEnabled?.()).then(
      (on) => {
        if (live) setReduced(Boolean(on));
      },
      () => undefined,
    );
    const watch = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (on) => setReduced(Boolean(on)));
    return () => {
      live = false;
      watch?.remove?.();
    };
  }, []);
  return reduced;
}

export type SliderAutoplayArgs = {
  /** How many slides the pager holds. With fewer than two nothing moves. */
  count: number;
  /** Explore is the tab on screen. */
  showing: boolean;
  /** The slide the person is on, and one slide's width. */
  current: number;
  width: number;
  scroller: RefObject<ScrollView | null>;
};

/**
 * The slider's own movement. It moves to the next slide every `everyMs` while there are two or more slides, Explore is on show, the
 * app is in front and the phone's reduce-motion setting is off. A touch or a drag by the person stops it, and it starts again
 * `everyMs` after the finger lifts. It only scrolls the pager: it never moves a screen reader's focus and never counts a tap.
 *
 * `travelling` is true while the slide back to the first passes the slides between: an advert passed on the way is not an advert
 * seen, so the caller holds its views until the pager has landed (or `rewindMs`, whichever comes first).
 */
export function useSliderAutoplay({ count, showing, current, width, scroller }: SliderAutoplayArgs) {
  const front = useInFront();
  const reduced = useReduceMotion();
  const [touching, setTouching] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Bumped after each move of its own, so the next one is `everyMs` after it.
  const [moves, setMoves] = useState(0);
  const [travelling, setTravelling] = useState(false);
  const goal = useRef<number | null>(null);
  const here = useRef(current);
  useEffect(() => {
    here.current = current;
  }, [current]);

  const run = count > 1 && showing && front && !reduced && !touching && !dragging;

  const moveTo = useCallback(
    (to: number) => {
      scroller.current?.scrollTo({ x: to * width, animated: true });
    },
    [scroller, width],
  );

  useEffect(() => {
    if (!run) return;
    const timer = setTimeout(() => {
      const at = here.current;
      const to = at + 1 < count ? at + 1 : 0;
      // Only a slide back across two or more slides passes any between.
      if (Math.abs(to - at) > 1) {
        goal.current = to * width;
        setTravelling(true);
      }
      moveTo(to);
      setMoves((n) => n + 1);
    }, m.everyMs);
    return () => clearTimeout(timer);
  }, [run, moves, count, width, moveTo]);

  // A rewind holds the views for `rewindMs` at most, in case the landing is never seen.
  useEffect(() => {
    if (!travelling) return;
    const timer = setTimeout(() => {
      goal.current = null;
      setTravelling(false);
    }, m.rewindMs);
    return () => clearTimeout(timer);
  }, [travelling]);

  // A pager that has gone out of sight has no finger on it any more, whatever the last event said (adjusted while drawing, not in an effect).
  const inSight = showing && front;
  const [sighted, setSighted] = useState(inSight);
  if (sighted !== inSight) {
    setSighted(inSight);
    if (!inSight) {
      setTouching(false);
      setDragging(false);
    }
  }

  const grabbed = useCallback(() => {
    goal.current = null;
    setTravelling(false);
  }, []);

  /** Call with every scroll offset the pager reports. */
  const scrolledTo = useCallback((x: number) => {
    if (goal.current === null || Math.abs(x - goal.current) >= 1) return;
    goal.current = null;
    setTravelling(false);
  }, []);

  return {
    travelling,
    scrolledTo,
    /** The pager's own touch and drag events (the real handlers, on the ScrollView). */
    touch: {
      onTouchStart: () => {
        grabbed();
        setTouching(true);
      },
      onTouchEnd: () => setTouching(false),
      onTouchCancel: () => setTouching(false),
      onScrollBeginDrag: () => {
        grabbed();
        setDragging(true);
      },
      onScrollEndDrag: () => setDragging(false),
    },
  };
}
