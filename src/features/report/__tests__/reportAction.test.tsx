import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AttachmentBubble } from '@/features/chat/AttachmentBubbles';
import { TextBubble } from '@/features/chat/Bubbles';
import { MessagePost } from '@/features/communities/MessagePost';
import { CommentRow } from '@/features/content-detail/Parts';

import { reportAction } from '../LongPressable';

/*
 * REPORT-UGC round 1 (LOW 5). Press and hold was the only way to report a comment, a room message or a chat message. Each of those
 * rows now also carries a "Report" accessibility action on its accessible element (TalkBack's and VoiceOver's actions menu), and
 * only when the thing is somebody else's. On Platform.OS android, the real rows.
 */
const frame = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const draw = (ui: React.ReactElement) => rtl.render(<SafeAreaProvider initialMetrics={frame}>{ui}</SafeAreaProvider>);
const act = (name: string) => ({ nativeEvent: { actionName: name } });
const REPORT = [{ name: 'report', label: 'Report' }];

beforeEach(() => jest.replaceProperty(Platform, 'OS', 'android'));
afterEach(() => jest.restoreAllMocks());

describe('a screen reader can report from the rows, as a hold does', () => {
  it('a chat message: the action is on the bubble and calls the report; the person\'s own has none', async () => {
    const onReport = jest.fn();
    await draw(
      <>
        <TextBubble id="theirs" text="rude" mine={false} at="2026-10-16T17:40:00.000Z" onLongPress={onReport} />
        <TextBubble id="mine" text="kind" mine at="2026-10-16T17:41:00.000Z" />
      </>,
    );
    expect(rtl.screen.getByTestId('bubble-theirs').props.accessibilityActions).toEqual(REPORT);
    expect(rtl.screen.getByTestId('bubble-mine').props.accessibilityActions).toBeUndefined();
    await rtl.fireEvent(rtl.screen.getByTestId('bubble-theirs'), 'accessibilityAction', act('report'));
    expect(onReport).toHaveBeenCalledTimes(1);
    // An action the row does not own does nothing.
    await rtl.fireEvent(rtl.screen.getByTestId('bubble-theirs'), 'accessibilityAction', act('activate'));
    expect(onReport).toHaveBeenCalledTimes(1);
  });

  it('a chat file or photo (an attachment bubble)', async () => {
    const onReport = jest.fn();
    await draw(<AttachmentBubble id="file1" kind="file" mine={false} contentType="application/pdf" uri={null} name="brief.pdf" bytes={1000} caption={null} at="2026-10-16T17:40:00.000Z" onLongPress={onReport} />);
    const row = rtl.screen.getAllByLabelText(/brief\.pdf/)[0];
    expect(row.props.accessibilityActions).toEqual(REPORT);
    await rtl.fireEvent(row, 'accessibilityAction', act('report'));
    expect(onReport).toHaveBeenCalledTimes(1);
  });

  it('a room message', async () => {
    const onReport = jest.fn();
    const message = { id: 'm1', communityId: 'c1', senderWawuId: 'someone', text: 'spam spam', imageUrl: null, sentAt: '2026-10-16T17:40:00.000Z', sender: { name: 'Ada', handle: 'ada', avatarUrl: null } };
    await draw(<MessagePost message={message as never} sender={undefined} isHost={false} onLongPress={onReport} />);
    const row = rtl.screen.getByTestId('post-m1');
    expect(row.props.accessibilityActions).toEqual(REPORT);
    await rtl.fireEvent(row, 'accessibilityAction', act('report'));
    expect(onReport).toHaveBeenCalledTimes(1);
  });

  it('a comment: the action is on its words, and a comment with no report handler (the person\'s own) has none', async () => {
    const onReport = jest.fn();
    const comment = { id: 'c1', contentId: 'p1', authorWawuId: 'someone', text: 'rude comment', createdAt: '2026-10-16T17:40:00.000Z', likes: 0, likedByMe: false, author: { name: 'Ada', avatarUrl: null } };
    await draw(
      <>
        <CommentRow comment={comment as never} testID="theirs" onReport={onReport} />
        <CommentRow comment={{ ...comment, id: 'c2', text: 'my own comment' } as never} testID="mine" />
      </>,
    );
    const words = rtl.screen.getByText('rude comment');
    expect(words.props.accessibilityActions).toEqual(REPORT);
    expect(rtl.screen.getByText('my own comment').props.accessibilityActions).toBeUndefined();
    await rtl.fireEvent(words, 'accessibilityAction', act('report'));
    expect(onReport).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }));
  });

  it('with nothing to report the helper adds nothing', () => {
    expect(reportAction(undefined)).toEqual({});
  });
});
