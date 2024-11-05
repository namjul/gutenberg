/**
 * WordPress dependencies
 */
import { layout } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { getTemplatePartIcon } from './get-template-part-icon';
const EMPTY_OBJECT = {};

export const getTemplateInfo = ( {
	templateTypes,
	templateAreas,
	template,
} ) => {
	const { description, slug, title, area } = template;

	const { title: defaultTitle, description: defaultDescription } =
		Object.values( templateTypes ).find( ( type ) => type.slug === slug ) ??
		EMPTY_OBJECT;

	const templateTitle = typeof title === 'string' ? title : title?.rendered;
	const templateDescription =
		typeof description === 'string' ? description : description?.raw;

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
