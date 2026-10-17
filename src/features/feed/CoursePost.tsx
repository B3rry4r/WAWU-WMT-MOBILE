import { useQuery } from '@tanstack/react-query';

import { detailKey, fetchContentDetail } from './api';
import type { PostProps } from './PostFrame';
import { VideoPost } from './VideoPost';

/**
 * H7: a course in the feed. Its free lesson plays in the frame (the creator's first lesson is the
 * preview), the pill says how many lessons are free ("Course · lesson 1 free"), and the offer bar
 * names the course, its lessons and the price. The lessons and which of them are free are the Hub's
 * (`GET /content/{id}/detail`); until it is read, or if it cannot be, the pill and the bar leave
 * those words out and keep the rest.
 */
export function CoursePost(props: PostProps) {
  const { item } = props;
  const detail = useQuery({ queryKey: detailKey(item.id), queryFn: () => fetchContentDetail(item.id) });
  return <VideoPost {...props} course detail={detail.data} />;
}
