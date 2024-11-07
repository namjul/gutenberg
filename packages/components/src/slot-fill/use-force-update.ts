/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

export default function useForceUpdate() {
	const [ , setState ] = useState( {} );

	return () => {
		setState( {} );
	};
}
