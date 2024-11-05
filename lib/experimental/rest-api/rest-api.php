<?php
/**
 * Override templates and template part REST API registration.
 *
 * @package gutenberg
 */

function gutenberg_update_template_template_part_rest_api( $args, $post_type ) {
	if ( 'wp_template' === $post_type || 'wp_template_part' === $post_type ) {
		$args['rest_controller_class'] = 'Gutenberg_REST_Templates_Controller';
	}

	return $args;
}

add_filter( 'register_post_type_args', 'gutenberg_update_template_template_part_rest_api', 10, 2 );
