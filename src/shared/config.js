const api_path = 'https://api.pinboard.in/v1/';

const display_overlay_headings = true; // default: true
const display_overlay_on_page_load = true;
const display_overlay_on_page_load_only_if_not_tagged = false;
const display_overlay_on_page_load_only_if_tagged = false;
const display_overlay_recent = true; // default: true
const inhibit_sites_on_page_load = true;

const noisy = true;   //d:f
const noisy_auth = true;   //d:f
const noisy_background_msg_listener = true;   //d:f
const noisy_settings = true;   //d:f
const noisy_store = true;   //d:f

const log_anchor_on_click = false;
const log_anchor_on_create = false;
const log_auth_sent_to_fg = true;   //d:f
const log_make_site_tags_row_element = true;  ///
const log_pin_on_load = true; //d:f
const log_pin_on_store = true; //d:f
const log_read_current_response = true;
const log_site_url_on_pin_delete = false;
const log_site_url_on_site_load = true; //d:f
const log_title_on_pin_load = true; //d:f
const log_version_on_extn_install = true; //d:f
const log_version_on_page_load = true; //d:f

// features
//
const recent_tags_count_max = 22;
const ux_recent_row_with_bookmark_button = true;
const ux_recent_row_with_close_button = true;
const ux_recent_row_with_private_button = true;
const ux_recent_row_with_delete_pin = true;
const ux_recent_row_with_input = true;

// constants
//
const msg_b2f_clicked_browser_action = "b2f_clicked_browser_action";
// const msg_b2f_block_url = 'b2f_block_url';
const msg_f2b_block_url = "f2b_block_url";
const msg_f2b_delete_pin = "f2b_delete_pin";
const msg_f2b_delete_tag = "f2b_delete_tag";
const msg_f2b_inhibit_url_append = "f2b_update_inhibit"
const msg_f2b_read_current = "f2b_read_current";
const msg_f2b_read_options = "f2b_read_options";
const msg_f2b_read_pin = "f2b_read_pin"
const msg_f2b_read_recent = "f2b_read_recent";
const msg_f2b_save_tag = "f2b_save_tag";
const msg_inject_on_complete = "inject_on_complete"
