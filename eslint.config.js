// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    pnpm: true,
    rules: {
      'pnpm/yaml-enforce-settings': 'off',
      'node/prefer-global/process': 'off',
      'no-console': 'off',
      'ts/explicit-function-return-type': 'off',
    },
  },
)
