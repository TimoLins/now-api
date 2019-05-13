/* eslint-disable import/no-extraneous-dependencies */
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import filesize from 'rollup-plugin-filesize'
import minify from 'rollup-plugin-babel-minify'

export default {
  input: 'src/index.js',
  output: {
    name: 'NowClient',
    file: 'lib/index.js',
    format: 'umd',
    sourcemap: true,
  },
  plugins: [
    babel({
      ignore: ['node_modules/**'],
      presets: [['@babel/env', { targets: { chrome: 55 }, modules: false }]],
      plugins: ['@babel/plugin-proposal-class-properties'],
    }),
    resolve(),
    commonjs(),
    process.env.NODE_ENV === 'production' && minify({ sourceMap: false }),
    process.env.NODE_ENV === 'production' && filesize(),
  ],
}
