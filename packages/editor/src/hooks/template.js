/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
/**
 * Internal dependencies
 */
import { getTemplatePartIcon } from '../utils';

const EMPTY_OBJECT = {};

export const useGetDefaultTemplateTypes = () => {
	return useSelect( ( select ) => {
		return (
			// @ts-expect-error __unstableBase is not in the types
			select( coreStore ).getEntityRecord( 'root', '__unstableBase' ) ??
			[]
		);
	}, [] );
};

export const useGetDefaultTemplatePartAreas = () => {
	const areas = useGetDefaultTemplateTypes();

	return areas.map( ( item ) => {
		return { ...item, icon: getTemplatePartIcon( item.icon ) };
	} );
};

export const useGetDefaultTemplateType = ( slug ) => {
	const templateTypes = useGetDefaultTemplateTypes();
	if ( ! templateTypes ) {
		return EMPTY_OBJECT;
	}

	return (
		Object.values( templateTypes ).find(
			( type ) => type?.slug === slug
		) ?? EMPTY_OBJECT
	);
};
