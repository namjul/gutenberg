/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { getTemplateInfo } = unlock( editorPrivateApis );

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

			const templateAreas =
				select( coreStore ).getEntityRecord( 'root', '__unstableBase' )
					?.defaultTemplatePartAreas || [];

			const templateTypes =
				select( coreStore ).getEntityRecord( 'root', '__unstableBase' )
					?.defaultTemplateTypes || [];

			const templateInfo = getTemplateInfo( {
				template: _record,
				templateAreas,
				templateTypes,
			} );

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
