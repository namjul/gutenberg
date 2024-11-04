/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import {
	header as headerIcon,
	footer as footerIcon,
	sidebar as sidebarIcon,
	symbolFilled as symbolFilledIcon,
	layout,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

const EMPTY_OBJECT = {};

const getTemplatePartIcon = ( iconName ) => {
	if ( 'header' === iconName ) {
		return headerIcon;
	} else if ( 'footer' === iconName ) {
		return footerIcon;
	} else if ( 'sidebar' === iconName ) {
		return sidebarIcon;
	}
	return symbolFilledIcon;
};

const getInfoTemplate = ( select, template ) => {
	const { description, slug, title, area } = template;

	const templateTypes =
		select( coreStore ).getEntityRecord( 'root', '__unstableBase' )
			?.defaultTemplateTypes || EMPTY_OBJECT;

	const { title: defaultTitle, description: defaultDescription } =
		Object.values( templateTypes ).find( ( type ) => type.slug === slug ) ??
		EMPTY_OBJECT;

	const templateTitle = typeof title === 'string' ? title : title?.rendered;
	const templateDescription =
		typeof description === 'string' ? description : description?.raw;

	const templateAreas =
		select( coreStore ).getEntityRecord( 'root', '__unstableBase' )
			?.defaultTemplatePartAreas || [];

	const templateAreasWithIcon = templateAreas.map( ( item ) => ( {
		...item,
		icon: getTemplatePartIcon( item.icon ),
	} ) );

	const templateIcon =
		templateAreasWithIcon.find( ( item ) => area === item.area )?.icon ||
		layout;

	return {
		title:
			templateTitle && templateTitle !== slug
				? templateTitle
				: defaultTitle || slug,
		description: templateDescription || defaultDescription,
		icon: templateIcon,
	};
};

export default function useEditedEntityRecord( postType, postId ) {
	const { record, title, description, isLoaded, icon } = useSelect(
		( select ) => {
			const { getEditedPostType, getEditedPostId } =
				select( editSiteStore );
			const { getEditedEntityRecord, hasFinishedResolution } =
				select( coreStore );

			const usedPostType = postType ?? getEditedPostType();
			const usedPostId = postId ?? getEditedPostId();
			const _record = getEditedEntityRecord(
				'postType',
				usedPostType,
				usedPostId
			);

			const templateInfo = getInfoTemplate( select, _record );

			const _isLoaded =
				usedPostId &&
				hasFinishedResolution( 'getEditedEntityRecord', [
					'postType',
					usedPostType,
					usedPostId,
				] );

			return {
				record: _record,
				title: templateInfo.title,
				description: templateInfo.description,
				isLoaded: _isLoaded,
				icon: templateInfo.icon,
			};
		},
		[ postType, postId ]
	);

	return {
		isLoaded,
		icon,
		record,
		getTitle: () => ( title ? decodeEntities( title ) : null ),
		getDescription: () =>
			description ? decodeEntities( description ) : null,
	};
}
