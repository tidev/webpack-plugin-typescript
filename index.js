/* eslint indent: ["error", "tab", { "MemberExpression": "off" }] */

const fs = require('fs');
const path = require('path');

const { cacheIdentifiers } = require('./utils');

module.exports = function typeScriptPlugin(api, options) {
	api.watch([ 'tsconfig.json' ]);

	api.chainWebpack(config => {
		const isAlloy = options.type === 'alloy';

		config.resolveLoader.modules.add(path.join(__dirname, 'node_modules'));

		// entry -------------------------------------------------------------------

		let oldEntryFile = isAlloy ? './app/alloy.js' : './src/main.js';
		let tsEntryFile = isAlloy ? './app/alloy.ts' : './src/main.ts';
		if (fs.existsSync(tsEntryFile)) {
			config.entry('main')
				.delete(oldEntryFile)
				.add(tsEntryFile);
		}

		// resolve -----------------------------------------------------------------

		config.resolve
			.extensions
				.prepend('.ts');

		// module rules ------------------------------------------------------------

		const tsRule = config.module
			.rule('ts')
				.test(/\.ts$/)
				.exclude
					.add(/node_modules/)
					.end();

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

		const enableEslint = hasEslintDependencies(api.context.pkg);
		let eslintOptions;
		if (enableEslint) {
			eslintOptions = {
				files: isAlloy ? './app/**/*' : './src/**/*'
			};
		}
		const tsCheckerOptions = {
			eslint: eslintOptions
		};
		config.plugin('fork-ts-checker')
			.use(require('fork-ts-checker-webpack-plugin'), [ tsCheckerOptions ]);
	});
};

function hasEslintDependencies(pkg) {
	const deps = Object.keys(pkg.dependencies || {})
		.concat(pkg.devDependencies || {});
	const eslintPackages = [
		'eslint',
		'@typescript-eslint/parser',
		'@typescript-eslint/eslint-plugin'
	];
	return eslintPackages.every(name => deps.some(d => d === name));
}
