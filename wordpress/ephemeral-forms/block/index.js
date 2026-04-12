( function ( blocks, element, blockEditor, components, i18n ) {
	var el          = element.createElement;
	var Fragment    = element.Fragment;
	var useState    = element.useState;
	var useEffect   = element.useEffect;
	var InspectorControls = blockEditor.InspectorControls;
	var PanelBody   = components.PanelBody;
	var TextControl = components.TextControl;
	var RangeControl = components.RangeControl;
	var Placeholder = components.Placeholder;
	var __          = i18n.__;
	var baseUrl     = ( window.efBlockData && window.efBlockData.baseUrl ) || 'https://ephemeralforms.web.app';

	var iconEl = el( 'svg', { viewBox: '0 0 32 32', width: 24, height: 24 },
		el( 'rect', { x: 4, y: 2, width: 20, height: 26, rx: 3, fill: '#6c5ce7' } ),
		el( 'rect', { x: 8, y: 8, width: 10, height: 2, rx: 1, fill: 'rgba(255,255,255,0.9)' } ),
		el( 'rect', { x: 8, y: 13, width: 12, height: 2, rx: 1, fill: 'rgba(255,255,255,0.6)' } ),
		el( 'rect', { x: 8, y: 18, width: 8, height: 2, rx: 1, fill: 'rgba(255,255,255,0.4)' } ),
		el( 'circle', { cx: 26, cy: 6, r: 2, fill: '#6c5ce7', opacity: 0.7 } ),
		el( 'circle', { cx: 28, cy: 12, r: 1.5, fill: '#6c5ce7', opacity: 0.45 } ),
		el( 'circle', { cx: 26, cy: 17, r: 1, fill: '#6c5ce7', opacity: 0.25 } )
	);

	blocks.registerBlockType( 'ephemeral-forms/embed', {
		title: __( 'Ephemeral Form', 'ephemeral-forms' ),
		description: __( 'Embed a privacy-first form from Ephemeral Forms.', 'ephemeral-forms' ),
		icon: iconEl,
		category: 'embed',
		keywords: [ 'form', 'survey', 'embed', 'ephemeral' ],
		attributes: {
			token:  { type: 'string', default: '' },
			height: { type: 'number', default: 600 },
		},
		supports: {
			align: [ 'wide', 'full' ],
			html: false,
		},

		edit: function ( props ) {
			var token  = props.attributes.token;
			var height = props.attributes.height;

			function onChangeToken( val ) {
				// Accept full URL or just the token
				var match = val.match( /\/share\/([^/?#]+)/ );
				props.setAttributes( { token: match ? match[1] : val.trim() } );
			}

			// No token — show placeholder
			if ( ! token ) {
				return el( Fragment, {},
					el( InspectorControls, {},
						el( PanelBody, { title: __( 'Form Settings', 'ephemeral-forms' ) },
							el( TextControl, {
								label: __( 'Share Token or URL', 'ephemeral-forms' ),
								value: token,
								onChange: onChangeToken,
								help: __( 'Paste the share link or token from Ephemeral Forms.', 'ephemeral-forms' ),
							} ),
							el( RangeControl, {
								label: __( 'Height (px)', 'ephemeral-forms' ),
								value: height,
								onChange: function ( v ) { props.setAttributes( { height: v } ); },
								min: 300,
								max: 1200,
								step: 50,
							} )
						)
					),
					el( Placeholder, {
						icon: iconEl,
						label: __( 'Ephemeral Form', 'ephemeral-forms' ),
						instructions: __( 'Enter your share token or paste the full share URL.', 'ephemeral-forms' ),
					},
						el( TextControl, {
							placeholder: __( 'Share token or URL...', 'ephemeral-forms' ),
							value: token,
							onChange: onChangeToken,
							className: 'ef-block-token-input',
						} )
					)
				);
			}

			// Has token — show preview
			var src = baseUrl + '/#/share/' + encodeURIComponent( token );

			return el( Fragment, {},
				el( InspectorControls, {},
					el( PanelBody, { title: __( 'Form Settings', 'ephemeral-forms' ) },
						el( TextControl, {
							label: __( 'Share Token or URL', 'ephemeral-forms' ),
							value: token,
							onChange: onChangeToken,
						} ),
						el( RangeControl, {
							label: __( 'Height (px)', 'ephemeral-forms' ),
							value: height,
							onChange: function ( v ) { props.setAttributes( { height: v } ); },
							min: 300,
							max: 1200,
							step: 50,
						} )
					)
				),
				el( 'div', {
					className: 'ef-block-preview',
					style: { position: 'relative', width: '100%', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' },
				},
					el( 'div', {
						style: {
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							padding: '8px 12px',
							background: '#f8f8f8',
							borderBottom: '1px solid #ddd',
							fontSize: '12px',
							color: '#666',
						},
					},
						iconEl,
						el( 'span', {}, __( 'Ephemeral Form', 'ephemeral-forms' ) ),
						el( 'code', { style: { marginLeft: 'auto', fontSize: '11px', color: '#999' } }, token )
					),
					el( 'iframe', {
						src: src,
						width: '100%',
						height: height,
						frameBorder: '0',
						style: { display: 'block', border: 'none' },
						title: 'Ephemeral Form Preview',
					} )
				)
			);
		},

		save: function () {
			// Rendered server-side via PHP render_callback
			return null;
		},
	} );

} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );
