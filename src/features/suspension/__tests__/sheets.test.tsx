// USER-SUSPEND (R-121), on the native platform (Android). A sheet is a React Native Modal and on a phone a Modal sits above every
// screen, so the calm /suspended screen would open hidden beneath an open sheet (a picture of the web export showed the comments
// sheet over it). While a sheet is open, the Hub's `account_suspended` refusal closes it. A closed sheet is not touched, and a
// sheet that has gone away stops listening.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Platform, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/BottomSheet';
import { reportSuspendedRefusal } from '@/api/suspension';
import { CommentsSheet } from '@/features/content-detail/CommentsSheet';
import type { Page } from '@/features/content-detail/usePage';

const refusal = { message: 'Your account is suspended. Contact support@wawuafrica.com.', supportEmail: 'support@wawuafrica.com' };

async function render(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{child}</SafeAreaProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('a sheet gives way to the suspended screen', () => {
  it('closes an open bottom sheet when the Hub refuses a write, once', async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet visible onClose={onClose} label="Tip">
        <Text>Send a tip</Text>
      </BottomSheet>,
    );
    expect(onClose).not.toHaveBeenCalled();
    await rtl.act(async () => reportSuspendedRefusal(refusal));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes a sheet that cannot be dismissed by hand (a payment in flight): the refusal means nothing will go through', async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet visible dismissible={false} onClose={onClose} label="Pay">
        <Text>Paying</Text>
      </BottomSheet>,
    );
    await rtl.act(async () => reportSuspendedRefusal(refusal));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('leaves a closed sheet alone, and stops listening once it is gone', async () => {
    const closed = jest.fn();
    const open = jest.fn();
    await render(
      <>
        <BottomSheet visible={false} onClose={closed} label="Closed">
          <Text>Closed</Text>
        </BottomSheet>
        <BottomSheet visible onClose={open} label="Open">
          <Text>Open</Text>
        </BottomSheet>
      </>,
    );
    await rtl.act(async () => reportSuspendedRefusal(refusal));
    expect(closed).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledTimes(1);
    await rtl.act(async () => rtl.screen.unmount());
    await rtl.act(async () => reportSuspendedRefusal(refusal));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('closes the comments sheet when a comment is refused', async () => {
    const onClose = jest.fn();
    const page = {
      me: { data: undefined },
      comments: { isPending: false, isError: false, data: { pages: [{ items: [] }] }, hasNextPage: false, isFetchingNextPage: false, refetch: jest.fn(), fetchNextPage: jest.fn() },
      post: { isPending: false, mutate: jest.fn() },
      likeComment: { mutate: jest.fn(), isPending: false },
    } as unknown as Page;
    await render(<CommentsSheet visible onClose={onClose} count={0} page={page} />);
    expect(rtl.screen.getByTestId('comments-input')).toBeTruthy();
    await rtl.act(async () => reportSuspendedRefusal(refusal));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
