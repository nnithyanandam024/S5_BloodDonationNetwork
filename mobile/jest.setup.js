/* eslint-disable no-undef */

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    enableScreens: jest.fn(),
    compatibilityFlags: {
      usesNewAndroidHeaderHeightImplementation: false,
    },
    Screen: ({ children, ...props }: any) => React.createElement(View, props, children),
    ScreenContainer: ({ children, ...props }: any) => React.createElement(View, props, children),
    ScreenStack: ({ children, ...props }: any) => React.createElement(View, props, children),
    ScreenStackItem: ({ children, ...props }: any) => React.createElement(View, props, children),
    ScreenStackHeaderConfig: ({ children, ...props }: any) => React.createElement(View, props, children),
    ScreenStackHeaderSubview: ({ children, ...props }: any) => React.createElement(View, props, children),
    SearchBar: ({ children, ...props }: any) => React.createElement(View, props, children),
    FullWindowOverlay: ({ children, ...props }: any) => React.createElement(View, props, children),
  };
});
