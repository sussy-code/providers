export const isReactNative = () => {
  try {
    // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
    require('react-native');
    return true;
  } catch {
    return false;
  }
};
