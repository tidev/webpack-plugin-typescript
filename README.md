# @titanium-sdk/webpack-plugin-typescript

> TypeScript plugin for Appcd Webpack

## Installation

To install this plugin in an existing project, run the following command in your project root:

```sh
npm i -D @titanium-sdk/webpack-plugin-typescript typescript @types/titanium
```

Since `typescript` is a peer dependency of this package, you can use the version of TypeScript that you need. All versions >=2.0 are supported.

You can opt-in to use ESLint in addition to TypeScript's type checking. See the [ESLint](#eslint) section for details.

This plugin can be used alongside `@titanium-sdk/webpack-plugin-babel`. When used with Babel, make sure to let TypeScript output ES2015 code so Babel can handle transpiling.

## Configuration

After installing the plugin, TypeScript can be configured via `tsconfig.json`. For best performance, all type checking is done in a seperate process with [`fork-ts-checker-webpack-plugin`](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin).

> 💡 **NOTE:** Since all linting is done in a seperate process it will not fail the Webpack build when it detects errors.

### TypeScript

Create a `tsconfig.json` in the project root directory to configure TypeScript. See the following example configuration for recommended values when using TypeScript with Titanium.

> 💡 **NOTE:** When used with Babel, change the `target` to `es2015` so Babel can take care of transpiling your code.

```json
{
  "compilerOptions": {
    "target": "ES5",
    "module": "ESNext",
    "strict": true,
    "importHelpers": true,
    "allowJs": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "baseUrl": ".",
    "types": [
      "titanium"
    ],
    "paths": {
      "@/*": [
        "src/*"
      ]
    },
    "lib": [
      "esnext"
    ]
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

When used with [@titanium-sdk/webpack-plugin-alloy](https://github.com/appcelerator/webpack-plugin-alloy) a slight adjustment to the `tsconfig.json` is neccessary:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": [
        "app/*"
      ]
    },
    "lib": [
      "esnext",
      "dom"
    ]
  },
  "include": [
    "app/**/*.ts"
  ]
}
```

### ESLint

To opt-in to use ESLint for additional linting, simply install `eslint` and the relevant TypeScript parser and plugin.

```sh
npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

Configuration of ESLint can be done as usual with a `.eslintrc.js` in the project root. Here is an example to get you started.

```js
const path = require('path');

module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    'plugin:@typescript-eslint/recommended' // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  ],
  parserOptions: {
    project: path.resolve(__dirname, './tsconfig.json'),
    tsconfigRootDir: __dirname,
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
  },
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
  }
};
```

## Webpack configuration

This plugin will add/modify the following Webpack options:

### Rules

- `rule('ts')`
- `rule('ts').use('cache-loader')`
- `rule('ts').use('babel-loader')` (when used alongside `@titanium-sdk/webpack-plugin-babel`)
- `rule('ts').use('ts-loader')`

### Plugins

- `plugin('fork-ts-checker')` (when `eslint` is installed the `eslint` option will automatically be set to `true`)
