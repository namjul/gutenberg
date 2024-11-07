/**
 * WordPress dependencies
 */
import { useMemo, useContext } from '@wordpress/element';
import { useObservableValue } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';
import type { FillRef, SlotRef, FillProps, SlotKey } from '../types';

export default function useSlot( name: SlotKey ) {
	const registry = useContext( SlotFillContext );
	const slot = useObservableValue( registry.slots, name );

	const api = useMemo(
		() => ( {
			updateSlot: ( ref: SlotRef, fillProps: FillProps ) =>
				registry.updateSlot( name, ref, fillProps ),
			unregisterSlot: ( ref: SlotRef ) =>
				registry.unregisterSlot( name, ref ),
			registerFill: ( ref: FillRef ) =>
				registry.registerFill( name, ref ),
			unregisterFill: ( ref: FillRef ) =>
				registry.unregisterFill( name, ref ),
		} ),
		[ name, registry ]
	);

	return {
		...slot,
		...api,
	};
}
