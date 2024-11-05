<?php
/**
 * REST API: Gutenberg_REST_Templates_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 * @since 5.8.0
 */

/**
 * Base Templates REST API Controller.
 *
 * @since 5.8.0
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Templates_Controller extends Gutenberg_REST_Registered_Entity_Controller {

	/**
	 * Constructor.
	 *
	 * @since 6.6.0
	 *
	 * @param string $post_type Post type.
	 */
	public function __construct( $post_type ) {
		parent::__construct( $post_type );

		$this->id_format = (
			/*
				* Matches theme's directory: `/themes/<subdirectory>/<theme>/` or `/themes/<theme>/`.
				* Excludes invalid directory name characters: `/:<>*?"|`.
				*/
			'([^\/:<>\*\?"\|]+(?:\/[^\/:<>\*\?"\|]+)?)' .
			// Matches the template name.
			'[\/\w%-]+'
		);
	}

	/**
	 * Registers the controllers routes.
	 *
	 * @since 5.8.0
	 * @since 6.1.0 Endpoint for fallback template content.
	 */
	public function register_routes() {
		// Get fallback template content.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/lookup',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_template_fallback' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'slug'            => array(
							'description' => __( 'The slug of the template to get the fallback for', 'gutenberg' ),
							'type'        => 'string',
							'required'    => true,
						),
						'is_custom'       => array(
							'description' => __( 'Indicates if a template is custom or part of the template hierarchy', 'gutenberg' ),
							'type'        => 'boolean',
						),
						'template_prefix' => array(
							'description' => __( 'The template prefix for the created template. This is used to extract the main template type, e.g. in `taxonomy-books` extracts the `taxonomy`', 'gutenberg' ),
							'type'        => 'string',
						),
					),
				),
			)
		);

		parent::register_routes();
	}

	/**
	 * Requesting this endpoint for a template like 'twentytwentytwo//home'
	 * requires using a path like /wp/v2/templates/twentytwentytwo//home. There
	 * are special cases when WordPress routing corrects the name to contain
	 * only a single slash like 'twentytwentytwo/home'.
	 *
	 * This method doubles the last slash if it's not already doubled. It relies
	 * on the template ID format {theme_name}//{template_slug} and the fact that
	 * slugs cannot contain slashes.
	 *
	 * @since 5.9.0
	 * @see https://core.trac.wordpress.org/ticket/54507
	 *
	 * @param string $id Template ID.
	 * @return string Sanitized template ID.
	 */
	public function _sanitize_id( $id ) {
		$id = urldecode( $id );

		$last_slash_pos = strrpos( $id, '/' );
		if ( false === $last_slash_pos ) {
			return $id;
		}

		$is_double_slashed = substr( $id, $last_slash_pos - 1, 1 ) === '/';
		if ( $is_double_slashed ) {
			return $id;
		}
		return (
			substr( $id, 0, $last_slash_pos )
			. '/'
			. substr( $id, $last_slash_pos )
		);
	}

	protected function query_items( $query ) {
		return get_block_templates( $query, $this->post_type );
	}

	protected function get_item_from_source( $id, $source = null ) {
		if ( 'theme' === $source ) {
			$template = get_block_file_template( $id, $this->post_type );
		} else {
			$template = get_block_template( $id, $this->post_type );
		}

		return $template;
	}

	protected function prepare_changes_for_database( $changes, $item, $request ) {
		if ( 'wp_template' === $this->post_type && isset( $request['is_wp_suggestion'] ) ) {
			$changes->meta_input     = wp_parse_args(
				array(
					'is_wp_suggestion' => $request['is_wp_suggestion'],
				),
				$changes->meta_input = array()
			);
		}

		if ( 'wp_template_part' === $this->post_type ) {
			if ( isset( $request['area'] ) ) {
				$changes->tax_input['wp_template_part_area'] = _filter_block_template_part_area( $request['area'] );
			} elseif ( null !== $item && 'custom' !== $item->source && $item->area ) {
				$changes->tax_input['wp_template_part_area'] = _filter_block_template_part_area( $item->area );
			} elseif ( empty( $item->area ) ) {
				$changes->tax_input['wp_template_part_area'] = WP_TEMPLATE_PART_AREA_UNCATEGORIZED;
			}
		}
	}

	public function prepare_item_for_response( $item, $request ) {
		/*
		 * Resolve pattern blocks so they don't need to be resolved client-side
		 * in the editor, improving performance.
		 */
		$blocks        = parse_blocks( $item->content );
		$blocks        = resolve_pattern_blocks( $blocks );
		$item->content = serialize_blocks( $blocks );

		return parent::prepare_item_for_response( $item, $request );
	}

	protected function prepare_additonal_item_fields_for_response( $data, $item, $request ) {
		$fields = $this->get_fields_for_response( $request );

		if ( rest_is_field_included( 'content.block_version', $fields ) ) {
			$data['content']['block_version'] = block_version( $item->content );
		}

		if ( rest_is_field_included( 'is_custom', $fields ) && 'wp_template' === $item->type ) {
			$data['is_custom'] = $item->is_custom;
		}

		if ( rest_is_field_included( 'area', $fields ) && 'wp_template_part' === $item->type ) {
			$data['area'] = $item->area;
		}

		return $data;
	}

	/**
	 * Retrieves the query params for the posts collection.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$collection_params = parent::get_collection_params();
		if ( 'wp_template_part' === $this->post_type ) {
			$collection_params['area'] = array(
				'description' => __( 'Limit to the specified template part area.', 'gutenberg' ),
				'type'        => 'string',
			);
		}
		return $collection_params;
	}


	protected function add_additional_fields_schema( $schema ) {
		$schema = parent::add_additional_fields_schema( $schema );

		if ( 'wp_template' === $this->post_type ) {
			$schema['properties']['is_custom'] = array(
				'description' => __( 'Whether a template is a custom template.', 'gutenberg' ),
				'type'        => 'bool',
				'context'     => array( 'embed', 'view', 'edit' ),
				'readonly'    => true,
			);
		}

		if ( 'wp_template_part' === $this->post_type ) {
			$schema['properties']['area'] = array(
				'description' => __( 'Where the template part is intended for use (header, footer, etc.)', 'gutenberg' ),
				'type'        => 'string',
				'context'     => array( 'embed', 'view', 'edit' ),
			);
		}

		$schema['properties']['content'] = array(
			'description' => __( 'Content of item.', 'gutenberg' ),
			'type'        => array( 'object', 'string' ),
			'default'     => '',
			'context'     => array( 'embed', 'view', 'edit' ),
			'properties'  => array(
				'raw'           => array(
					'description' => __( 'Content for the item, as it exists in the database.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit' ),
				),
				'block_version' => array(
					'description' => __( 'Version of the content block format used by the item.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'edit' ),
					'readonly'    => true,
				),
			),
		);

		return $schema;
	}

	/**
	 * Returns the fallback template for the given slug.
	 *
	 * @since 6.1.0
	 * @since 6.3.0 Ignore empty templates.
	 *
	 * @param WP_REST_Request $request The request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_template_fallback( $request ) {
		$hierarchy = get_template_hierarchy( $request['slug'], $request['is_custom'], $request['template_prefix'] );

		do {
			$fallback_template = resolve_block_template( $request['slug'], $hierarchy, '' );
			array_shift( $hierarchy );
		} while ( ! empty( $hierarchy ) && empty( $fallback_template->content ) );

		// To maintain original behavior, return an empty object rather than a 404 error when no template is found.
		$response = $fallback_template ? $this->prepare_item_for_response( $fallback_template, $request ) : new stdClass();

		return rest_ensure_response( $response );
	}
}
