/* eslint indent: ["error", "tab", { "MemberExpression": "off" }] */

const path = require('path');

const { cacheIdentifiers } = require('./utils');

module.exports = function typeScriptPlugin(api, options) {
	api.watch([ 'tsconfig.json' ]);

	api.chainWebpack(config => {
		config.resolveLoader.modules.add(path.join(__dirname, 'node_modules'));

		// entry -------------------------------------------------------------------

		let oldEntryFile = options.type === 'alloy' ? './app/alloy.js' : './src/main.js';
		let tsEntryFile = options.type === 'alloy' ? './app/alloy.ts' : './src/main.ts';
		config.entry('main')
			.delete(oldEntryFile)
			.add(tsEntryFile);

		// resolve -----------------------------------------------------------------

		config.resolve
			.extensions
				.prepend('.ts');

		// module rules ------------------------------------------------------------

		const tsRule = config.module
			.rule('ts')
				.test(/\.ts$/);

		let cacheConfig;
		if (api.hasPlugin('babel')) {
			const { generateCacheIdentifiers, loadBabelConfig } = api.requirePeer('@titanium-sdk/webpack-plugin-babel/utils');
			const { options: babelOptions } = loadBabelConfig(api, options);
			const babelCacheIdentifiers = generateCacheIdentifiers(babelOptions);
			cacheConfig = api.generateCacheConfig(
				'ts-loader',
				{ ...cacheIdentifiers, ...babelCacheIdentifiers },
				[ 'babel.config.js', 'tsconfig.json' ]
			);

			tsRule.use('babel-loader')
				.before('ts-loader')
				.loader('babel-loader')
				.options(babelOptions);
		} else {
			cacheConfig = api.generateCacheConfig(
				'ts-loader',
				{ ...cacheIdentifiers },
				[ 'tsconfig.json' ]
			);
		}

		tsRule
			.use('cache-loader')
				.loader('cache-loader')
				.options(cacheConfig)
				.end()
			.use('ts-loader')
				.loader('ts-loader')
				.options({
					transpileOnly: true
				});

		// plugins -----------------------------------------------------------------

		const eslint = Object.keys(api.context.pkg.dependencies || {})
			.concat(api.context.pkg.devDependencies || {})
			.some(dep => dep === 'eslint');
		config.plugin('fork-ts-checker')
			.use(require('fork-ts-checker-webpack-plugin'), [
				{
					eslint,
					formatter: 'codeframe'
				}
			]);
	});
};
