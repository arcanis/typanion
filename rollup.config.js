import ts from "@rollup/plugin-typescript";

export default {
  input: './sources/index.ts',
  output: [
    {
      dir: 'lib',
      entryFileNames: '[name].mjs',
      format: 'es'
    },
    {
      dir: 'lib',
      entryFileNames: '[name].js',
      format: 'cjs'
    },
  ],
  plugins: [
    ts({
      tsconfig: 'tsconfig.build.json'
    }),
  ],
};
