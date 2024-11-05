/**
 * External dependencies
 */
import clsx from 'clsx';

export const useClickableItemProps = < Item >(
	item: Item,
	isItemClickable: ( item: Item ) => boolean,
	onClickItem: ( item: Item ) => void,
	className: string
) => {
	const isClickable = isItemClickable( item );

	return {
		className: clsx( className, {
			[ className + '--clickable' ]: isClickable,
		} ),
		role: isItemClickable( item ) ? 'button' : undefined,
		onClick: () => {
			if ( isClickable ) {
				onClickItem( item );
			}
		},
		tabIndex: isClickable ? 0 : undefined,
		onKeyDown: ( event: React.KeyboardEvent ) => {
			if (
				( event.key === 'Enter' || event.key === '' ) &&
				isClickable
			) {
				onClickItem( item );
			}
		},
	};
};
