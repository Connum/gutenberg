/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	BlockControls,
	AlignmentToolbar,
} from '@wordpress/block-editor';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { name as buttonBlockName } from '../button/';

const ALLOWED_BLOCKS = [ buttonBlockName ];
const BUTTONS_TEMPLATE = [ [ 'core/button' ] ];
const ALIGNMENT_MAP = {
	left: 'flex-start',
	center: 'center',
	right: 'flex-end',
};

function ButtonsEdit( {
	isSelected,
	attributes,
	setAttributes,
	onDelete,
	onAddNextButton,
	shouldDelete,
} ) {
	const { align } = attributes;

	function updateAlignment( nextAlign ) {
		setAttributes( { align: nextAlign } );
	}

	function renderAppender() {
		if ( isSelected ) {
			return (
				<InnerBlocks.ButtonBlockAppender
					flex={ false }
					customOnAdd={ onAddNextButton }
				/>
			);
		}
		return null;
	}

	const buttonsStyle = {
		justifyContent: ALIGNMENT_MAP[ align ],
	};

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					isCollapsed={ false }
					value={ align }
					onChange={ updateAlignment }
				/>
			</BlockControls>
			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				template={ BUTTONS_TEMPLATE }
				renderAppender={ renderAppender }
				__experimentalMoverDirection="horizontal"
				style={ buttonsStyle }
				customOnDelete={ shouldDelete && onDelete }
				customOnAdd={ onAddNextButton }
			/>
		</>
	);
}

export default compose(
	withSelect( ( select, { clientId } ) => {
		const { getBlockCount } = select( 'core/block-editor' );

		return {
			// The purpose of `shouldDelete` check is giving the ability to pass to
			// mobile toolbar function called `onDelete` which removes the whole
			// `Buttons` container along with the last inner button when
			// there is exactly one button.
			shouldDelete: getBlockCount( clientId ) === 1,
		};
	} ),
	withDispatch( ( dispatch, { clientId }, registry ) => {
		const { replaceInnerBlocks, selectBlock, removeBlock } = dispatch(
			'core/block-editor'
		);
		const { getBlocks, getBlockOrder } = registry.select(
			'core/block-editor'
		);
		const innerBlocks = getBlocks( clientId );

		return {
			// The purpose of `onAddNextButton` is giving the ability to automatically
			// adding `Button` inside `Buttons` block on the appender press event.
			onAddNextButton: ( selectedId ) => {
				const order = getBlockOrder( clientId );
				const selectedButtonIndex = order.findIndex(
					( i ) => i === selectedId
				);

				const index =
					selectedButtonIndex === -1
						? order.length + 1
						: selectedButtonIndex;

				const insertedBlock = createBlock( 'core/button' );

				innerBlocks.splice( index + 1, 0, insertedBlock );

				replaceInnerBlocks( clientId, innerBlocks, true );
				selectBlock( insertedBlock.clientId );
			},
			onDelete: () => {
				removeBlock( clientId );
			},
		};
	} )
)( ButtonsEdit );
