import { guider } from '@neato/guider';

const withGuider = guider({
  themeConfig: './theme.config.tsx',
});

export default withGuider({
  output: 'export',
  basePath: '/providers',
});
