<?php
/**
 * REST API: WP_REST_Registered_Entity_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 */


/**
 * Base REST API Controller for theme entities.
 * Entities that are registrable by themes or plugins and editable by users.
 *
 * @see WP_REST_Controller
 */
abstract class Gutenberg_REST_Registered_Entity_Controller extends WP_REST_Controller {

	/**
	 * Post type.
	 *
	 * @var string
	 */
	protected $post_type;

	/**
	 * Post type.
	 *
	 * @var string
	 */
	protected $id_format = '[\/\w%-]+';

	/**
	 * Constructor.
	 *
	 * @param string $post_type Post type.
	 */
	public function __construct( $post_type ) {
		$this->post_type = $post_type;
		$obj             = get_post_type_object( $post_type );
		$this->rest_base = ! empty( $obj->rest_base ) ? $obj->rest_base : $obj->name;
		$this->namespace = ! empty( $obj->rest_namespace ) ? $obj->rest_namespace : 'wp/v2';
	}

	/**
	 * Registers the controllers routes.
	 */
	public function register_routes() {
		// Lists all items.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		// Lists/updates a single item based on the given id.
		register_rest_route(
			$this->namespace,
			// The route.
			sprintf(
				'/%s/(?P<id>%s)',
				$this->rest_base,
				$this->id_format
			),
			array(
				'args'   => array(
					'id' => array(
						'description'       => __( 'The id of a entity item', 'gutenberg' ),
						'type'              => 'string',
						'sanitize_callback' => array( $this, '_sanitize_id' ),
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'context' => $this->get_context_param( array( 'default' => 'view' ) ),
					),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
					'args'                => array(
						'force' => array(
							'type'        => 'boolean',
							'default'     => false,
							'description' => __( 'Whether to bypass Trash and force deletion.', 'gutenberg' ),
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	abstract protected function query_items( $query );
	abstract protected function get_item_from_source( $id, $source = null );


	/**
	 * Checks if the user has permissions to make the request.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	protected function permissions_check( $request ) {
		/*
		 * Verify if the current user has edit_theme_options capability.
		 * This capability is required to edit/view/delete items.
		 */
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_cannot_manage_registered_entities',
				__( 'Sorry, you are not allowed to access the registered entities on this site.', 'gutenberg' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}

		return true;
	}

	/**
	 * Some entities like templates require ID sanitization.
	 * This function can be overriden to do so.
	 *
	 * @see https://core.trac.wordpress.org/ticket/54507
	 *
	 * @param string $id ID.
	 * @return string Sanitized ID.
	 */
	protected function _sanitize_id( $id ) {
		return $id;
	}

	/**
	 * Some entities like templates additional changes to be saved.
	 * This function can be overriden to do so.
	 *
	 * @param stdClass $changes Changes to persist.
	 * @param WP_Block_Template $item Item instance.
	 * @param WP_REST_Request $request Full details about the request.
	 */
	protected function prepare_changes_for_database( $changes, $item, $request ) {}

	/**
	 * Prepare a single item output for response
	 *
	 * @param Array             $data    Prepared response data.
	 * @param WP_Block_Template $item    Item instance.
	 * @param WP_REST_Request   $request Request object.
	 * @return Array Prepared response data.
	 */
	protected function prepare_additonal_item_fields_for_response( $data, $item, $request ) {
		return $data;
	}

	/**
	 * Checks if a given request has access to read items.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		if ( current_user_can( 'edit_posts' ) ) {
			return true;
		}
		foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type ) {
			if ( current_user_can( $post_type->cap->edit_posts ) ) {
				return true;
			}
		}

		return new WP_Error(
			'rest_cannot_manage_registered_entities',
			__( 'Sorry, you are not allowed to access the registered entities on this site.', 'gutenberg' ),
			array(
				'status' => rest_authorization_required_code(),
			)
		);
	}

	/**
	 * Returns a list of items.
	 *
	 * @param WP_REST_Request $request The request instance.
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		$query = array();
		if ( isset( $request['wp_id'] ) ) {
			$query['wp_id'] = $request['wp_id'];
		}
		if ( isset( $request['area'] ) ) {
			$query['area'] = $request['area'];
		}
		if ( isset( $request['post_type'] ) ) {
			$query['post_type'] = $request['post_type'];
		}

		$items = array();
		foreach ( $this->query_items( $query ) as $item ) {
			$data    = $this->prepare_item_for_response( $item, $request );
			$items[] = $this->prepare_response_for_collection( $data );
		}

		return rest_ensure_response( $items );
	}

	/**
	 * Checks if a given request has access to read a single item.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		if ( current_user_can( 'edit_posts' ) ) {
			return true;
		}
		foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type ) {
			if ( current_user_can( $post_type->cap->edit_posts ) ) {
				return true;
			}
		}

		return new WP_Error(
			'rest_cannot_manage_registered_entities',
			__( 'Sorry, you are not allowed to access the registered entities on this site.', 'gutenberg' ),
			array(
				'status' => rest_authorization_required_code(),
			)
		);
	}

	/**
	 * Returns the given item
	 *
	 * @param WP_REST_Request $request The request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_item( $request ) {
		$item = $this->get_item_from_source( $request['id'], isset( $request['source'] ) ? $request['source'] : null );

		if ( ! $item ) {
			return new WP_Error( 'rest_registered_entity_not_found', __( 'No items exist with that id.', 'gutenberg' ), array( 'status' => 404 ) );
		}

		return $this->prepare_item_for_response( $item, $request );
	}

	/**
	 * Checks if a given request has access to write a single item.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has write access for the item, WP_Error object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		return $this->permissions_check( $request );
	}

	/**
	 * Updates a single item.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$item = $this->get_item_from_source( $request['id'] );
		if ( ! $item ) {
			return new WP_Error( 'rest_registered_entity_not_found', __( 'No items exist with that id.', 'gutenberg' ), array( 'status' => 404 ) );
		}

		$post_before = get_post( $item->wp_id );

		// Resets the item to the registered version.
		if ( isset( $request['source'] ) && 'theme' === $request['source'] ) {
			wp_delete_post( $item->wp_id, true );
			$request->set_param( 'context', 'edit' );
			$item     = $this->get_item_from_source( $request['id'] );
			$response = $this->prepare_item_for_response( $item, $request );

			return rest_ensure_response( $response );
		}

		$changes = $this->prepare_item_for_database( $request );

		if ( is_wp_error( $changes ) ) {
			return $changes;
		}

		if ( 'custom' === $item->source ) {
			$update = true;
			$result = wp_update_post( wp_slash( (array) $changes ), false );
		} else {
			$update      = false;
			$post_before = null;
			$result      = wp_insert_post( wp_slash( (array) $changes ), false );
		}

		if ( is_wp_error( $result ) ) {
			if ( 'db_update_error' === $result->get_error_code() ) {
				$result->add_data( array( 'status' => 500 ) );
			} else {
				$result->add_data( array( 'status' => 400 ) );
			}
			return $result;
		}

		$item          = $this->get_item_from_source( $request['id'] );
		$fields_update = $this->update_additional_fields_for_object( $item, $request );
		if ( is_wp_error( $fields_update ) ) {
			return $fields_update;
		}

		$request->set_param( 'context', 'edit' );
		$post = get_post( $item->wp_id );
		/** This action is documented in wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php */
		do_action( "rest_after_insert_{$this->post_type}", $post, $request, false );
		wp_after_insert_post( $post, $update, $post_before );

		$response = $this->prepare_item_for_response( $item, $request );

		return rest_ensure_response( $response );
	}

	/**
	 * Checks if a given request has access to create an item.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		return $this->permissions_check( $request );
	}

	/**
	 * Creates a single item.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		$prepared_post = $this->prepare_item_for_database( $request );

		if ( is_wp_error( $prepared_post ) ) {
			return $prepared_post;
		}

		$prepared_post->post_name = $request['slug'];
		$post_id                  = wp_insert_post( wp_slash( (array) $prepared_post ), true );
		if ( is_wp_error( $post_id ) ) {
			if ( 'db_insert_error' === $post_id->get_error_code() ) {
				$post_id->add_data( array( 'status' => 500 ) );
			} else {
				$post_id->add_data( array( 'status' => 400 ) );
			}

			return $post_id;
		}
		$posts = $this->query_items( array( 'wp_id' => $post_id ) );
		if ( ! count( $posts ) ) {
			return new WP_Error( 'rest_registered_entities_insert_error', __( 'No items exist with that id.', 'gutenberg' ), array( 'status' => 400 ) );
		}
		$id            = $posts[0]->id;
		$post          = get_post( $post_id );
		$item          = $this->get_item_from_source( $id );
		$fields_update = $this->update_additional_fields_for_object( $item, $request );
		if ( is_wp_error( $fields_update ) ) {
			return $fields_update;
		}

		/** This action is documented in wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php */
		do_action( "rest_after_insert_{$this->post_type}", $post, $request, true );

		wp_after_insert_post( $post, false, null );

		$response = $this->prepare_item_for_response( $item, $request );
		$response = rest_ensure_response( $response );

		$response->set_status( 201 );
		$response->header( 'Location', rest_url( sprintf( '%s/%s/%s', $this->namespace, $this->rest_base, $item->id ) ) );

		return $response;
	}

	/**
	 * Checks if a given request has access to delete a single item.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has delete access for the item, WP_Error object otherwise.
	 */
	public function delete_item_permissions_check( $request ) {
		return $this->permissions_check( $request );
	}

	/**
	 * Deletes a single item.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {
		$item = $this->get_item_from_source( $request['id'] );
		if ( ! $item ) {
			return new WP_Error( 'rest_registered_entity_not_found', __( 'No items exist with that id.', 'gutenberg' ), array( 'status' => 404 ) );
		}
		if ( 'custom' !== $item->source ) {
			return new WP_Error( 'rest_invalid_registered_entity', __( 'Registered items can\'t be removed.', 'gutenberg' ), array( 'status' => 400 ) );
		}

		$id    = $item->wp_id;
		$force = (bool) $request['force'];

		$request->set_param( 'context', 'edit' );

		// If we're forcing, then delete permanently.
		if ( $force ) {
			$previous = $this->prepare_item_for_response( $item, $request );
			$result   = wp_delete_post( $id, true );
			$response = new WP_REST_Response();
			$response->set_data(
				array(
					'deleted'  => true,
					'previous' => $previous->get_data(),
				)
			);
		} else {
			// Otherwise, only trash if we haven't already.
			if ( 'trash' === $item->status ) {
				return new WP_Error(
					'rest_registered_entity_already_trashed',
					__( 'The registered item has already been deleted.', 'gutenberg' ),
					array( 'status' => 410 )
				);
			}

			/*
			 * (Note that internally this falls through to `wp_delete_post()`
			 * if the Trash is disabled.)
			 */
			$result       = wp_trash_post( $id );
			$item->status = 'trash';
			$response     = $this->prepare_item_for_response( $item, $request );
		}

		if ( ! $result ) {
			return new WP_Error(
				'rest_cannot_delete',
				__( 'The item cannot be deleted.', 'gutenberg' ),
				array( 'status' => 500 )
			);
		}

		return $response;
	}

	/**
	 * Prepares a single item for create or update.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return stdClass|WP_Error Changes to pass to wp_update_post.
	 */
	protected function prepare_item_for_database( $request ) {
		$item    = $request['id'] ? $this->get_item_from_source( $request['id'] ) : null;
		$changes = new stdClass();
		if ( null === $item ) {
			$changes->post_type   = $this->post_type;
			$changes->post_status = 'publish';
			$changes->tax_input   = array(
				'wp_theme' => isset( $request['theme'] ) ? $request['theme'] : get_stylesheet(),
			);
		} elseif ( 'custom' !== $item->source ) {
			$changes->post_name   = $item->slug;
			$changes->post_type   = $this->post_type;
			$changes->post_status = 'publish';
			$changes->tax_input   = array(
				'wp_theme' => $item->theme,
			);
			$changes->meta_input  = array(
				'origin' => $item->source,
			);
		} else {
			$changes->post_name   = $item->slug;
			$changes->ID          = $item->wp_id;
			$changes->post_status = 'publish';
		}
		if ( isset( $request['content'] ) ) {
			if ( is_string( $request['content'] ) ) {
				$changes->post_content = $request['content'];
			} elseif ( isset( $request['content']['raw'] ) ) {
				$changes->post_content = $request['content']['raw'];
			}
		} elseif ( null !== $item && 'custom' !== $item->source ) {
			$changes->post_content = $item->content;
		}
		if ( isset( $request['title'] ) ) {
			if ( is_string( $request['title'] ) ) {
				$changes->post_title = $request['title'];
			} elseif ( ! empty( $request['title']['raw'] ) ) {
				$changes->post_title = $request['title']['raw'];
			}
		} elseif ( null !== $item && 'custom' !== $item->source ) {
			$changes->post_title = $item->title;
		}
		if ( isset( $request['description'] ) ) {
			$changes->post_excerpt = $request['description'];
		} elseif ( null !== $item && 'custom' !== $item->source ) {
			$changes->post_excerpt = $item->description;
		}

		if ( ! empty( $request['author'] ) ) {
			$post_author = (int) $request['author'];

			if ( get_current_user_id() !== $post_author ) {
				$user_obj = get_userdata( $post_author );

				if ( ! $user_obj ) {
					return new WP_Error(
						'rest_invalid_author',
						__( 'Invalid author ID.', 'gutenberg' ),
						array( 'status' => 400 )
					);
				}
			}

			$changes->post_author = $post_author;
		}

		$this->prepare_changes_for_database( $changes, $item, $request );

		/** This filter is documented in wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php */
		return apply_filters( "rest_pre_insert_{$this->post_type}", $changes, $request );
	}

	/**
	 * Prepare a single item output for response
	 *
	 * @param WP_Block_Template $item    Item instance.
	 * @param WP_REST_Request   $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$fields = $this->get_fields_for_response( $request );

		// Base fields for every item.
		$data = array();

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = $item->id;
		}

		if ( rest_is_field_included( 'theme', $fields ) ) {
			$data['theme'] = $item->theme;
		}

		if ( rest_is_field_included( 'content', $fields ) ) {
			$data['content'] = array();
		}
		if ( rest_is_field_included( 'content.raw', $fields ) ) {
			$data['content']['raw'] = $item->content;
		}

		if ( rest_is_field_included( 'slug', $fields ) ) {
			$data['slug'] = $item->slug;
		}

		if ( rest_is_field_included( 'source', $fields ) ) {
			$data['source'] = $item->source;
		}

		if ( rest_is_field_included( 'origin', $fields ) ) {
			$data['origin'] = $item->origin;
		}

		if ( rest_is_field_included( 'type', $fields ) ) {
			$data['type'] = $item->type;
		}

		if ( rest_is_field_included( 'description', $fields ) ) {
			$data['description'] = $item->description;
		}

		if ( rest_is_field_included( 'title', $fields ) ) {
			$data['title'] = array();
		}

		if ( rest_is_field_included( 'title.raw', $fields ) ) {
			$data['title']['raw'] = $item->title;
		}

		if ( rest_is_field_included( 'title.rendered', $fields ) ) {
			if ( $item->wp_id ) {
				/** This filter is documented in wp-includes/post-template.php */
				$data['title']['rendered'] = apply_filters( 'the_title', $item->title, $item->wp_id );
			} else {
				$data['title']['rendered'] = $item->title;
			}
		}

		if ( rest_is_field_included( 'status', $fields ) ) {
			$data['status'] = $item->status;
		}

		if ( rest_is_field_included( 'wp_id', $fields ) ) {
			$data['wp_id'] = (int) $item->wp_id;
		}

		if ( rest_is_field_included( 'has_theme_file', $fields ) ) {
			$data['has_theme_file'] = (bool) $item->has_theme_file;
		}

		if ( rest_is_field_included( 'author', $fields ) ) {
			$data['author'] = (int) $item->author;
		}

		if ( rest_is_field_included( 'modified', $fields ) ) {
			$data['modified'] = mysql_to_rfc3339( $item->modified );
		}

		if ( rest_is_field_included( 'original_source', $fields ) ) {
			$data['original_source'] = self::get_item_original_source_field( $item );
		}

		if ( rest_is_field_included( 'author_text', $fields ) ) {
			$data['author_text'] = self::get_item_author_text_field( $item );
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->prepare_additonal_item_fields_for_response( $data, $item, $request );
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );

		if ( rest_is_field_included( '_links', $fields ) || rest_is_field_included( '_embedded', $fields ) ) {
			$links = $this->prepare_links( $item->id );
			$response->add_links( $links );
			if ( ! empty( $links['self']['href'] ) ) {
				$actions = $this->get_available_actions();
				$self    = $links['self']['href'];
				foreach ( $actions as $rel ) {
					$response->add_link( $rel, $self );
				}
			}
		}

		return $response;
	}

	/**
	 * Returns the source from where the item originally comes from.
	 *
	 * @param WP_Block_Template $item Item instance.
	 * @return string                 Original source of the item one of theme, plugin, site, or user.
	 */
	private static function get_item_original_source_field( $item ) {
		/*
			* Added by theme.
			* Item originally provided by a theme, but customized by a user.
			* Item originally didn't have the 'origin' field so identify
			* older customized items by checking for no origin and a 'theme'
			* or 'custom' source.
			*/
		if ( $item->has_theme_file &&
		( 'theme' === $item->origin || (
			empty( $item->origin ) && in_array(
				$item->source,
				array(
					'theme',
					'custom',
				),
				true
			) )
		)
		) {
			return 'theme';
		}

		// Added by plugin.
		if ( $item->has_theme_file && 'plugin' === $item->origin ) {
			return 'plugin';
		}

		/*
			* Added by site.
			* Item was created from scratch, but has no author. Author support
			* was only added to items in WordPress 5.9.
			*/
		if ( empty( $item->has_theme_file ) && 'custom' === $item->source && empty( $item->author ) ) {
			return 'site';
		}

		// Added by user.
		return 'user';
	}

	/**
	 * Returns a human readable text for the author of the item.
	 *
	 * @param WP_Block_Template $item Item instance.
	 * @return string                 Human readable text for the author.
	 */
	private static function get_item_author_text_field( $item ) {
		$original_source = self::get_item_original_source_field( $item );
		switch ( $original_source ) {
			case 'theme':
				$theme_name = wp_get_theme( $item->theme )->get( 'Name' );
				return empty( $theme_name ) ? $item->theme : $theme_name;
			case 'plugin':
				$plugins = get_plugins();
				$plugin  = $plugins[ plugin_basename( sanitize_text_field( $item->theme . '.php' ) ) ];
				return empty( $plugin['Name'] ) ? $item->theme : $plugin['Name'];
			case 'site':
				return get_bloginfo( 'name' );
			case 'user':
				$author = get_user_by( 'id', $item->author );
				if ( ! $author ) {
					return __( 'Unknown author', 'gutenberg' );
				}
				return $author->get( 'display_name' );
		}

		// Fail-safe to return a string should the original source ever fall through.
		return '';
	}


	/**
	 * Prepares links for the request.
	 *
	 * @param integer $id ID.
	 * @return array Links for the given post.
	 */
	protected function prepare_links( $id ) {
		$links = array(
			'self'       => array(
				'href' => rest_url( sprintf( '/%s/%s/%s', $this->namespace, $this->rest_base, $id ) ),
			),
			'collection' => array(
				'href' => rest_url( rest_get_route_for_post_type_items( $this->post_type ) ),
			),
			'about'      => array(
				'href' => rest_url( 'wp/v2/types/' . $this->post_type ),
			),
		);

		if ( post_type_supports( $this->post_type, 'revisions' ) ) {
			$item = $this->get_item_from_source( $id );
			if ( ! empty( $item->wp_id ) ) {
				$revisions       = wp_get_latest_revision_id_and_total_count( $item->wp_id );
				$revisions_count = ! is_wp_error( $revisions ) ? $revisions['count'] : 0;
				$revisions_base  = sprintf( '/%s/%s/%s/revisions', $this->namespace, $this->rest_base, $id );

				$links['version-history'] = array(
					'href'  => rest_url( $revisions_base ),
					'count' => $revisions_count,
				);

				if ( $revisions_count > 0 ) {
					$links['predecessor-version'] = array(
						'href' => rest_url( $revisions_base . '/' . $revisions['latest_id'] ),
						'id'   => $revisions['latest_id'],
					);
				}
			}
		}

		return $links;
	}

	/**
	 * Get the link relations available for the post and current user.
	 *
	 * @return string[] List of link relations.
	 */
	protected function get_available_actions() {
		$rels = array();

		$post_type = get_post_type_object( $this->post_type );

		if ( current_user_can( $post_type->cap->publish_posts ) ) {
			$rels[] = 'https://api.w.org/action-publish';
		}

		if ( current_user_can( 'unfiltered_html' ) ) {
			$rels[] = 'https://api.w.org/action-unfiltered-html';
		}

		return $rels;
	}

	/**
	 * Retrieves the query params for the posts collection.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		return array(
			'context'   => $this->get_context_param( array( 'default' => 'view' ) ),
			'wp_id'     => array(
				'description' => __( 'Limit to the specified post id.', 'gutenberg' ),
				'type'        => 'integer',
			),
			'post_type' => array(
				'description' => __( 'Post type to get the items for.', 'gutenberg' ),
				'type'        => 'string',
			),
		);
	}

	/**
	 * Retrieves the block type' schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => $this->post_type,
			'type'       => 'object',
			'properties' => array(
				'id'              => array(
					'description' => __( 'ID.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'slug'            => array(
					'description' => __( 'Unique slug identifying the item.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'required'    => true,
					'minLength'   => 1,
					'pattern'     => '[a-zA-Z0-9_\%-]+',
				),
				'theme'           => array(
					'description' => __( 'Theme identifier for the item.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'type'            => array(
					'description' => __( 'Type of item.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'source'          => array(
					'description' => __( 'Source of item', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'origin'          => array(
					'description' => __( 'Source of a customized item', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'content'         => array(
					'description' => __( 'Content of item.', 'gutenberg' ),
					'type'        => array( 'object', 'string' ),
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'properties'  => array(
						'raw' => array(
							'description' => __( 'Content for the item, as it exists in the database.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit' ),
						),
					),
				),
				'title'           => array(
					'description' => __( 'Title of item.', 'gutenberg' ),
					'type'        => array( 'object', 'string' ),
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'properties'  => array(
						'raw'      => array(
							'description' => __( 'Title for the item, as it exists in the database.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
						),
						'rendered' => array(
							'description' => __( 'HTML title for the item, transformed for display.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
							'readonly'    => true,
						),
					),
				),
				'description'     => array(
					'description' => __( 'Description of item.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'status'          => array(
					'description' => __( 'Status of item.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array_keys( get_post_stati( array( 'internal' => false ) ) ),
					'default'     => 'publish',
					'context'     => array( 'embed', 'view', 'edit' ),
				),
				'wp_id'           => array(
					'description' => __( 'Post ID.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'has_theme_file'  => array(
					'description' => __( 'Theme file exists.', 'gutenberg' ),
					'type'        => 'bool',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'author'          => array(
					'description' => __( 'The ID for the author of the item.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'modified'        => array(
					'description' => __( "The date the item was last modified, in the site's timezone.", 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'author_text'     => array(
					'type'        => 'string',
					'description' => __( 'Human readable text for the author.', 'gutenberg' ),
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'original_source' => array(
					'description' => __( 'Where the item originally comes from e.g. \'theme\'', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
					'enum'        => array(
						'theme',
						'plugin',
						'site',
						'user',
					),
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}
}
