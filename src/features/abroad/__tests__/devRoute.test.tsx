/* eslint-disable @typescript-eslint/no-require-imports */
import { render, screen } from '@testing-library/react-native';
import type { ComponentType } from 'react';

/**
 * The Send abroad picture gallery (canned names and amounts, for a screen no board draws) is development only, and a release
 * build must not carry it (NUV-11 round 1, F5). A release build replaces `__DEV__` with `false` and drops the branch that
 * requires the module; in Jest `__DEV__` is a global, so these set it before the route is loaded and look at whether the
 * module was ever evaluated.
 */
const mockGalleryEvaluated = jest.fn();
jest.mock('@/features/abroad/Gallery', () => {
  mockGalleryEvaluated();
  const { Text } = require('react-native');
  const { createElement } = require('react');
  return { AbroadGallery: () => createElement(Text, { testID: 'abroad-gallery' }, 'gallery') };
});
jest.mock('@/features/shell/LeaveDevRoute', () => {
  const { Text } = require('react-native');
  const { createElement } = require('react');
  return { LeaveDevRoute: () => createElement(Text, { testID: 'left-dev-route' }, 'left') };
});

const globals = globalThis as unknown as { __DEV__: boolean };

function loadRoute(dev: boolean): ComponentType {
  globals.__DEV__ = dev;
  mockGalleryEvaluated.mockClear();
  let route: ComponentType = () => null;
  jest.isolateModules(() => {
    route = require('@/app/dev/abroad').default as ComponentType;
  });
  return route;
}

afterEach(() => {
  globals.__DEV__ = true;
});

describe('the Send abroad gallery route (F5)', () => {
  it('in a development build it draws the gallery', async () => {
    const Route = loadRoute(true);
    await render(<Route />);
    expect(screen.getByTestId('abroad-gallery')).toBeTruthy();
    expect(screen.queryByTestId('left-dev-route')).toBeNull();
  });

  it('in a release build the gallery module is never loaded and the visitor is sent where the app opens for them', async () => {
    const Route = loadRoute(false);
    expect(mockGalleryEvaluated).not.toHaveBeenCalled();
    await render(<Route />);
    expect(screen.getByTestId('left-dev-route')).toBeTruthy();
    expect(screen.queryByTestId('abroad-gallery')).toBeNull();
    expect(mockGalleryEvaluated).not.toHaveBeenCalled();
  });

  it('a build that turns development off after the route was loaded still leaves (the runtime guard)', async () => {
    const Route = loadRoute(true);
    globals.__DEV__ = false;
    await render(<Route />);
    expect(screen.getByTestId('left-dev-route')).toBeTruthy();
  });
});
