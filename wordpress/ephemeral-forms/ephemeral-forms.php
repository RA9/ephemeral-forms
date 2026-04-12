<?php
/**
 * Plugin Name: Ephemeral Forms
 * Plugin URI:  https://github.com/anthropics/ephemeral-forms
 * Description: Embed privacy-first, offline-capable forms into any WordPress page or post.
 * Version:     1.0.0
 * Author:      Ephemeral Forms
 * License:     MIT
 * Text Domain: ephemeral-forms
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'EF_VERSION', '1.0.0' );
define( 'EF_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'EF_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/* ------------------------------------------------------------------ */
/*  Settings                                                          */
/* ------------------------------------------------------------------ */

function ef_get_base_url() {
	return rtrim( get_option( 'ef_base_url', 'https://ephemeralforms.web.app' ), '/' );
}

/* Admin menu */
add_action( 'admin_menu', function () {
	add_options_page(
		'Ephemeral Forms',
		'Ephemeral Forms',
		'manage_options',
		'ephemeral-forms',
		'ef_settings_page'
	);
} );

/* Register setting */
add_action( 'admin_init', function () {
	register_setting( 'ef_settings', 'ef_base_url', [
		'type'              => 'string',
		'sanitize_callback' => 'esc_url_raw',
		'default'           => 'https://ephemeralforms.web.app',
	] );
} );

/* Settings page markup */
function ef_settings_page() {
	?>
	<div class="wrap">
		<h1>Ephemeral Forms Settings</h1>
		<form method="post" action="options.php">
			<?php settings_fields( 'ef_settings' ); ?>
			<table class="form-table">
				<tr>
					<th scope="row"><label for="ef_base_url">App Base URL</label></th>
					<td>
						<input type="url" id="ef_base_url" name="ef_base_url"
						       value="<?php echo esc_attr( ef_get_base_url() ); ?>"
						       class="regular-text" />
						<p class="description">
							The URL where your Ephemeral Forms app is hosted.<br>
							Default: <code>https://ephemeralforms.web.app</code>
						</p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>

		<hr>
		<h2>Usage</h2>
		<p>Use the shortcode in any page or post:</p>
		<pre><code>[ephemeral_form token="YOUR_SHARE_TOKEN"]</code></pre>
		<pre><code>[ephemeral_form token="YOUR_SHARE_TOKEN" height="700"]</code></pre>
		<p>Or use the <strong>Ephemeral Form</strong> block in the Gutenberg editor.</p>
	</div>
	<?php
}

/* ------------------------------------------------------------------ */
/*  Shortcode: [ephemeral_form token="..." height="600"]              */
/* ------------------------------------------------------------------ */

add_shortcode( 'ephemeral_form', function ( $atts ) {
	$atts = shortcode_atts( [
		'token'  => '',
		'height' => '600',
	], $atts, 'ephemeral_form' );

	$token  = sanitize_text_field( $atts['token'] );
	$height = absint( $atts['height'] );

	if ( ! $token ) {
		return '<p style="color:#888;font-style:italic;">Ephemeral Forms: missing <code>token</code> attribute.</p>';
	}

	$base = ef_get_base_url();
	$src  = esc_url( "{$base}/#/share/{$token}" );

	return sprintf(
		'<div class="ef-embed-wrap" style="width:100%%;max-width:100%%;margin:0 auto;">
			<iframe src="%s" width="100%%" height="%d"
			        frameborder="0"
			        allow="clipboard-write"
			        style="border:none;border-radius:8px;display:block;"
			        loading="lazy"
			        title="Ephemeral Form"></iframe>
		</div>',
		$src,
		$height
	);
} );

/* ------------------------------------------------------------------ */
/*  Gutenberg Block                                                   */
/* ------------------------------------------------------------------ */

add_action( 'init', function () {
	if ( ! function_exists( 'register_block_type' ) ) {
		return;
	}

	wp_register_script(
		'ef-block-editor',
		EF_PLUGIN_URL . 'block/index.js',
		[ 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n' ],
		EF_VERSION,
		true
	);

	wp_localize_script( 'ef-block-editor', 'efBlockData', [
		'baseUrl' => ef_get_base_url(),
	] );

	register_block_type( 'ephemeral-forms/embed', [
		'editor_script'   => 'ef-block-editor',
		'render_callback' => 'ef_block_render',
		'attributes'      => [
			'token'  => [ 'type' => 'string', 'default' => '' ],
			'height' => [ 'type' => 'number', 'default' => 600 ],
		],
	] );
} );

function ef_block_render( $attributes ) {
	return do_shortcode( sprintf(
		'[ephemeral_form token="%s" height="%d"]',
		esc_attr( $attributes['token'] ?? '' ),
		absint( $attributes['height'] ?? 600 )
	) );
}
