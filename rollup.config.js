import ts from "@wessberg/rollup-plugin-ts";

export default {
  input: './sources/index.ts',
  output: [
    {
      file: 'lib/index.mjs',
      format: 'es'
    },
    {
      file: 'lib/index.js',
      format: 'cjs'
    },
  ],
  plugins: [
    ts({
      tsconfig: 'tsconfig.build.json'
    }),
  ],
};
