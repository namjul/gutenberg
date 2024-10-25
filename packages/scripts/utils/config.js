/**
 * External dependencies
 */
const { readFileSync } = require( 'fs' );
const { basename, dirname, extname, join, sep } = require( 'path' );
const { sync: glob } = require( 'fast-glob' );

/**
 * Internal dependencies
 */
const {
	getArgsFromCLI,
	getFileArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
} = require( './cli' );
const { fromConfigRoot, fromProjectRoot, hasProjectFile } = require( './file' );
const { hasPackageProp } = require( './package' );
const {
	getBlockJsonModuleFields,
	getBlockJsonScriptFields,
} = require( './block-json' );

const { warn } = console;

// See https://babeljs.io/docs/en/config-files#configuration-file-types.
const hasBabelConfig = () =>
	hasProjectFile( '.babelrc.js' ) ||
	hasProjectFile( '.babelrc.json' ) ||
	hasProjectFile( 'babel.config.js' ) ||
	hasProjectFile( 'babel.config.json' ) ||
	hasProjectFile( '.babelrc' ) ||
	hasPackageProp( 'babel' );

// See https://cssnano.co/docs/config-file.
const hasCssnanoConfig = () =>
	hasProjectFile( '.cssnanorc' ) ||
	hasProjectFile( '.cssnanorc.js' ) ||
	hasProjectFile( '.cssnanorc.json' ) ||
	hasProjectFile( '.cssnanorc.yaml' ) ||
	hasProjectFile( '.cssnanorc.yml' ) ||
	hasProjectFile( 'cssnano.config.js' ) ||
	hasPackageProp( 'cssnano' );

/**
 * Returns path to a Jest configuration which should be provided as the explicit
 * configuration when there is none available for discovery by Jest in the
 * project environment. Returns undefined if Jest should be allowed to discover
 * an available configuration.
 *
 * This can be used in cases where multiple possible configurations are
 * supported. Since Jest will only discover `jest.config.js`, or `jest` package
 * directive, such custom configurations must be specified explicitly.
 *
 * @param {"e2e"|"unit"} suffix Suffix of configuration file to accept.
 *
 * @return {string= | undefined} Override or fallback configuration file path.
 */
function getJestOverrideConfigFile( suffix ) {
	if ( hasArgInCLI( '-c' ) || hasArgInCLI( '--config' ) ) {
		return;
	}

	if ( hasProjectFile( `jest-${ suffix }.config.js` ) ) {
		return fromProjectRoot( `jest-${ suffix }.config.js` );
	}

	if ( ! hasJestConfig() ) {
		return fromConfigRoot( `jest-${ suffix }.config.js` );
	}
}

// See https://jestjs.io/docs/configuration.
const hasJestConfig = () =>
	hasProjectFile( 'jest.config.js' ) ||
	hasProjectFile( 'jest.config.json' ) ||
	hasProjectFile( 'jest.config.ts' ) ||
	hasPackageProp( 'jest' );

// See https://prettier.io/docs/en/configuration.html.
const hasPrettierConfig = () =>
	hasProjectFile( '.prettierrc.js' ) ||
	hasProjectFile( '.prettierrc.json' ) ||
	hasProjectFile( '.prettierrc.toml' ) ||
	hasProjectFile( '.prettierrc.yaml' ) ||
	hasProjectFile( '.prettierrc.yml' ) ||
	hasProjectFile( 'prettier.config.js' ) ||
	hasProjectFile( '.prettierrc' ) ||
	hasPackageProp( 'prettier' );

const hasWebpackConfig = () =>
	hasArgInCLI( '--config' ) ||
	hasProjectFile( 'webpack.config.js' ) ||
	hasProjectFile( 'webpack.config.babel.js' );

// See https://github.com/michael-ciniawsky/postcss-load-config#usage (used by postcss-loader).
const hasPostCSSConfig = () =>
	hasProjectFile( 'postcss.config.js' ) ||
	hasProjectFile( '.postcssrc' ) ||
	hasProjectFile( '.postcssrc.json' ) ||
	hasProjectFile( '.postcssrc.yaml' ) ||
	hasProjectFile( '.postcssrc.yml' ) ||
	hasProjectFile( '.postcssrc.js' ) ||
	hasPackageProp( 'postcss' );

/**
 * Converts CLI arguments to the format which webpack understands.
 *
 * @see https://webpack.js.org/api/cli/#usage-with-config-file
 *
 * @return {Array} The list of CLI arguments to pass to webpack CLI.
 */
const getWebpackArgs = () => {
	// Gets all args from CLI without those prefixed with `--webpack`.
	let webpackArgs = getArgsFromCLI( [
		'--experimental-modules',
		'--webpack',
	] );

	const hasWebpackOutputOption =
		hasArgInCLI( '-o' ) || hasArgInCLI( '--output' );
	if (
		! hasWebpackOutputOption &&
		! hasArgInCLI( '--entry' ) &&
		hasFileArgInCLI()
	) {
		/**
		 * Converts a legacy path to the entry pair supported by webpack, e.g.:
		 * `./entry-one.js` -> `[ 'entry-one', './entry-one.js] ]`
		 * `entry-two.js` -> `[ 'entry-two', './entry-two.js' ]`
		 *
		 * @param {string} path The path provided.
		 *
		 * @return {string[]} The entry pair of its name and the file path.
		 */
		const pathToEntry = ( path ) => {
			const entryName = basename( path, '.js' );

			if ( ! path.startsWith( './' ) ) {
				path = './' + path;
			}

			return [ entryName, path ];
		};

		const fileArgs = getFileArgsFromCLI();
		if ( fileArgs.length > 0 ) {
			// Filters out all CLI arguments that are recognized as file paths.
			const fileArgsToRemove = new Set( fileArgs );
			webpackArgs = webpackArgs.filter( ( cliArg ) => {
				if ( fileArgsToRemove.has( cliArg ) ) {
					fileArgsToRemove.delete( cliArg );
					return false;
				}
				return true;
			} );

			// Converts all CLI arguments that are file paths to the `entry` format supported by webpack.
			// It is going to be consumed in the config through the WP_ENTRY global variable.
			const entry = {};
			fileArgs.forEach( ( fileArg ) => {
				const [ entryName, path ] = fileArg.includes( '=' )
					? fileArg.split( '=' )
					: pathToEntry( fileArg );
				entry[ entryName ] = path;
			} );
			process.env.WP_ENTRY = JSON.stringify( entry );
		}
	}

	if ( ! hasWebpackConfig() ) {
		webpackArgs.push( '--config', fromConfigRoot( 'webpack.config.js' ) );
	}

	return webpackArgs;
};

/**
 * Returns the WordPress source directory. It defaults to 'src' if the
 * `process.env.WP_SRC_DIRECTORY` variable is not set.
 *
 * @return {string} The WordPress source directory.
 */
function getWordPressSrcDirectory() {
	return process.env.WP_SRC_DIRECTORY || 'src';
}

/**
 * Detects the list of entry points to use with webpack. There are several steps:
 *  1. Use the legacy webpack 4 format passed as CLI arguments.
 *  2. Scan `block.json` files for scripts listed.
 *  3. Add `src/index.*` JavaScript file when exists.
 *  4. Add `src/style.*` CSS file when exists.
 *
 * @see https://webpack.js.org/concepts/entry-points/
 *
 * @param {'script' | 'module'} buildType
 */
function getWebpackEntryPoints( buildType ) {
	/**
	 * @return {Object<string,string>} The list of entry points.
	 */
	return () => {
		const entryPoints = {};

		// 1. Handles the legacy format for entry points when explicitly provided with the `process.env.WP_ENTRY`.
		if ( process.env.WP_ENTRY ) {
			return buildType === 'script'
				? JSON.parse( process.env.WP_ENTRY )
				: entryPoints;
		}

		// Continue only if the source directory exists.
		if ( ! hasProjectFile( getWordPressSrcDirectory() ) ) {
			warn(
				`Source directory "${ getWordPressSrcDirectory() }" was not found. Please confirm there is a "src" directory in the root or the value passed to --webpack-src-dir is correct.`
			);
			return entryPoints;
		}

		// 2. Checks whether any block metadata files can be detected in the defined source directory.
		//    It scans all discovered files looking for JavaScript assets and converts them to entry points.
		const blockMetadataFiles = glob( '**/block.json', {
			absolute: true,
			cwd: fromProjectRoot( getWordPressSrcDirectory() ),
		} );

		if ( blockMetadataFiles.length > 0 ) {
			const srcDirectory = fromProjectRoot(
				getWordPressSrcDirectory() + sep
			);

			for ( const blockMetadataFile of blockMetadataFiles ) {
				const fileContents = readFileSync( blockMetadataFile );
				let parsedBlockJson;
				// Wrapping in try/catch in case the file is malformed.
				// This happens especially when new block.json files are added,
				// at which point they are completely empty and therefore not valid JSON.
				try {
					parsedBlockJson = JSON.parse( fileContents );
				} catch ( error ) {
					warn(
						`Not scanning "${ blockMetadataFile.replace(
							fromProjectRoot( sep ),
							''
						) }" due to collect entry points due to malformed JSON.`
					);
					continue;
				}

				const fields =
					buildType === 'script'
						? getBlockJsonScriptFields( parsedBlockJson )
						: getBlockJsonModuleFields( parsedBlockJson );

				if ( ! fields ) {
					continue;
				}

				for ( const value of Object.values( fields ).flat() ) {
					if ( ! value.startsWith( 'file:' ) ) {
						continue;
					}

					// Removes the `file:` prefix.
					const filepath = join(
						dirname( blockMetadataFile ),
						value.replace( 'file:', '' )
					);

					// Takes the path without the file extension, and relative to the defined source directory.
					if ( ! filepath.startsWith( srcDirectory ) ) {
						warn(
							`Skipping "${ value.replace(
								'file:',
								''
							) }" listed in "${ blockMetadataFile.replace(
								fromProjectRoot( sep ),
								''
							) }". File is located outside of the "${ getWordPressSrcDirectory() }" directory.`
						);
						continue;
					}
					const entryName = filepath
						.replace( extname( filepath ), '' )
						.replace( srcDirectory, '' )
						.replace( /\\/g, '/' );

					// Detects the proper file extension used in the defined source directory.
					const [ entryFilepath ] = glob(
						`${ entryName }.?(m)[jt]s?(x)`,
						{
							absolute: true,
							cwd: fromProjectRoot( getWordPressSrcDirectory() ),
						}
					);

					if ( ! entryFilepath ) {
						warn(
							`Skipping "${ value.replace(
								'file:',
								''
							) }" listed in "${ blockMetadataFile.replace(
								fromProjectRoot( sep ),
								''
							) }". File does not exist in the "${ getWordPressSrcDirectory() }" directory.`
						);
						continue;
					}
					entryPoints[ entryName ] = entryFilepath;
				}
			}
		}

		// Don't do any further processing if this is a module build.
		// This only respects *module block.json fields.
		if ( buildType === 'module' ) {
			return entryPoints;
		}

		const hasBlockJsonInRoot = blockMetadataFiles.includes(
			fromProjectRoot( getWordPressSrcDirectory() ) + sep + 'block.json'
		);
		if ( ! hasBlockJsonInRoot ) {
			// 3. Checks whether a standard JavaScript file name can be detected in the defined source directory,
			//    and converts the discovered file to an entry point.
			const [ entryJavaScriptFile ] = glob( 'index.?(m)[jt]s?(x)', {
				absolute: true,
				cwd: fromProjectRoot( getWordPressSrcDirectory() ),
			} );
			if ( entryJavaScriptFile ) {
				entryPoints.index = entryJavaScriptFile;
			}

			// 4. Checks whether a standard CSS file name can be detected in the defined source directory,
			//    and converts the discovered file to an entry point.
			const [ entryCSSFile ] = glob( 'style.(pc|sc|sa|c)ss', {
				absolute: true,
				cwd: fromProjectRoot( getWordPressSrcDirectory() ),
			} );
			if ( entryCSSFile ) {
				entryPoints.style = entryCSSFile;
			}
		}

		if ( Object.keys( entryPoints ).length === 0 ) {
			warn(
				`No entry points discovered in the "${ getWordPressSrcDirectory() }" directory.`
			);
		}

		return entryPoints;
	};
}

/**
 * Returns the list of PHP file paths found in `block.json` files for the given props.
 *
 * @param {string}   context The path to search for `block.json` files.
 * @param {string[]} props   The props to search for in the `block.json` files.
 * @return {string[]} The list of PHP file paths.
 */
function getPhpFilePaths( context, props ) {
	// Continue only if the source directory exists.
	if ( ! hasProjectFile( context ) ) {
		return [];
	}

	// Checks whether any block metadata files can be detected in the defined source directory.
	const blockMetadataFiles = glob( '**/block.json', {
		absolute: true,
		cwd: fromProjectRoot( context ),
	} );

	const srcDirectory = fromProjectRoot( context + sep );

	return blockMetadataFiles.flatMap( ( blockMetadataFile ) => {
		const paths = [];
		let parsedBlockJson;
		try {
			parsedBlockJson = JSON.parse( readFileSync( blockMetadataFile ) );
		} catch ( error ) {
			warn(
				`Not scanning "${ blockMetadataFile.replace(
					fromProjectRoot( sep ),
					''
				) }" due to detect render files due to malformed JSON.`
			);
			return paths;
		}

		for ( const prop of props ) {
			if (
				typeof parsedBlockJson?.[ prop ] !== 'string' ||
				! parsedBlockJson[ prop ]?.startsWith( 'file:' )
			) {
				continue;
			}

			// Removes the `file:` prefix.
			const filepath = join(
				dirname( blockMetadataFile ),
				parsedBlockJson[ prop ].replace( 'file:', '' )
			);

			// Takes the path without the file extension, and relative to the defined source directory.
			if ( ! filepath.startsWith( srcDirectory ) ) {
				warn(
					`Skipping "${ parsedBlockJson[ prop ].replace(
						'file:',
						''
					) }" listed in "${ blockMetadataFile.replace(
						fromProjectRoot( sep ),
						''
					) }". File is located outside of the "${ context }" directory.`
				);
				continue;
			}
			paths.push( filepath.replace( /\\/g, '/' ) );
		}
		return paths;
	} );
}

module.exports = {
	getJestOverrideConfigFile,
	getWebpackArgs,
	getWordPressSrcDirectory,
	getWebpackEntryPoints,
	getPhpFilePaths,
	hasBabelConfig,
	hasCssnanoConfig,
	hasJestConfig,
	hasPostCSSConfig,
	hasPrettierConfig,
};
