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
		role: isClickable ? 'button' : undefined,
		tabIndex: isClickable ? 0 : undefined,
		onClick: ! isClickable ? undefined : () => onClickItem( item ),
		onKeyDown: ! isClickable
			? undefined
			: ( event: React.KeyboardEvent ) => {
					if ( event.key === 'Enter' || event.key === '' ) {
						onClickItem( item );
					}
			  },
	};
};
