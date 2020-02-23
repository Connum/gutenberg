/**
 * WordPress dependencies
 */
import { useMemo, useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SlotFillContext from './slot-fill-context';

function getIndexBasedOnDOMPosition( newRef, existingRefs ) {
	return existingRefs.findIndex( ( existingRef ) => {
		if (
			typeof window === 'undefined' ||
			! existingRef.current ||
			! newRef.current
		) {
			return false;
		}
		// Return true if newRef is located earlier in the DOM than the existingRef
		return Boolean(
			// eslint-disable-next-line no-bitwise
			existingRef.current.compareDocumentPosition( newRef.current ) &
				window.Node.DOCUMENT_POSITION_PRECEDING
		);
	} );
}

function useSlotRegistry() {
	const [ slots, setSlots ] = useState( {} );
	const [ fills, setFills ] = useState( {} );

	const registerSlot = useCallback( ( name, ref, fillProps = {} ) => {
		setSlots( ( prevSlots ) => ( {
			...prevSlots,
			[ name ]: {
				...prevSlots[ name ],
				ref: ref || prevSlots[ name ].ref,
				fillProps: fillProps || prevSlots[ name ].fillProps || {},
			},
		} ) );
	}, [] );

	const unregisterSlot = useCallback( ( name ) => {
		setSlots( ( prevSlots ) => {
			// eslint-disable-next-line no-unused-vars
			const { [ name ]: _, ...nextSlots } = prevSlots;
			return nextSlots;
		} );
	}, [] );

	const registerFill = useCallback( ( name, ref ) => {
		setFills( ( prevFills ) => {
			const prevSlotFills = prevFills[ name ] || [];
			const nextIndex = getIndexBasedOnDOMPosition( ref, prevSlotFills );
			if ( nextIndex === -1 ) {
				// Should be added as the last element
				return { ...prevFills, [ name ]: [ ...prevSlotFills, ref ] };
			}
			setSlots( ( prevSlots ) => ( {
				...prevSlots,
				[ name ]: {
					...prevSlots[ name ],
					key:
						prevSlots[ name ] && prevSlots[ name ].key
							? -prevSlots[ name ].key
							: 1,
				},
			} ) );
			return {
				...prevFills,
				[ name ]: [
					...prevSlotFills.slice( 0, nextIndex ),
					ref,
					...prevSlotFills.slice( nextIndex ),
				],
			};
		} );
	}, [] );

	const unregisterFill = useCallback( ( name, ref ) => {
		setFills( ( prevFills ) => {
			if ( prevFills[ name ] ) {
				return {
					...prevFills,
					[ name ]: prevFills[ name ].filter(
						( fillRef ) => fillRef !== ref
					),
				};
			}
			return prevFills;
		} );
	}, [] );

	// Memoizing the return value so it can be directly passed to Provider value
	const registry = useMemo(
		() => ( {
			slots,
			fills,
			registerSlot,
			// Just for readability
			updateSlot: registerSlot,
			unregisterSlot,
			registerFill,
			unregisterFill,
		} ),
		[
			slots,
			fills,
			registerSlot,
			unregisterSlot,
			registerFill,
			unregisterFill,
		]
	);

	return registry;
}

export default function SlotFillProvider( { children } ) {
	const registry = useSlotRegistry();
	return (
		<SlotFillContext.Provider value={ registry }>
			{ children }
		</SlotFillContext.Provider>
	);
}
