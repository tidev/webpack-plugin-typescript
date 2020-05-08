/* eslint indent: ["error", "tab", { "MemberExpression": "off" }] */

const path = require('path');

module.exports = function (api, options) {
	const tsCacheIdentifiers = {
		'ts-loader': require('ts-loader').version,
		typescript: require('typescript').version
	};

	api.watch([ 'tsconfig.json' ]);

	api.chainWebpack(config => {
		config.resolveLoader.modules.prepend(path.join(__dirname, 'node_modules'));

		// entry -------------------------------------------------------------------

		config.entry('main')
			.delete('./src/main.js')
			.add('./src/main.ts');

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
			const babelConfig = loadBabelConfig(api, options);
			const babelCacheIdentifiers = generateCacheIdentifiers(babelConfig);
			cacheConfig = api.generateCacheConfig(
				'ts-loader',
				{ ...tsCacheIdentifiers, ...babelCacheIdentifiers },
				[ 'babel.config.js', 'tsconfig.json' ]
			);

			tsRule.use('babel-loader')
				.before('ts-loader')
				.loader('babel-loader')
				.options(babelConfig.options);
		} else {
			cacheConfig = api.generateCacheConfig(
				'ts-loader',
				{ ...tsCacheIdentifiers },
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
