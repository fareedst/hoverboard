const api_path = 'https://api.pinboard.in/v1/';

const display_overlay_headings = true; // default: true
const display_overlay_on_page_load = true;
const display_overlay_on_page_load_only_if_not_tagged = false;
const display_overlay_on_page_load_only_if_tagged = false;
const display_overlay_recent = true; // default: true
const inhibit_sites_on_page_load = true;

const noisy = false;   //d:f
const noisy_auth = false;   //d:f
const noisy_background_msg_listener = false;   //d:f
const noisy_settings = false;   //d:f
const noisy_store = false;   //d:f

const log_anchor_on_click = false; //d:f
const log_anchor_on_create = false; //d:f
const log_auth_sent_to_fg = false;   //d:f
const log_make_site_tags_row_element = false; //d:f
const log_pin_on_load = false; //d:f
const log_pin_on_save = false; //d:f
const log_pin_on_store = false; //d:f
const log_pinurl_on_tag_delete = false;
const log_read_current_response = false; //d:f
const log_site_url_on_pin_delete = false; //d:f
const log_site_url_on_pin_save = false; //d:f
const log_site_url_on_site_load = false; //d:f
const log_site_url_on_tag_delete = false; //d:f
const log_title_on_pin_load = false; //d:f
const log_version_on_extn_install = false; //d:f
const log_version_on_page_load = false; //d:f

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
const msg_f2b_delete_pin = "f2b_delete_pin";
const msg_f2b_delete_tag = "f2b_delete_tag";
const msg_f2b_inhibit_url_append = "f2b_update_inhibit"
const msg_f2b_read_current = "f2b_read_current";
const msg_f2b_read_options = "f2b_read_options";
const msg_f2b_read_pin = "f2b_read_pin"
const msg_f2b_read_recent = "f2b_read_recent";
const msg_f2b_save_tag = "f2b_save_tag";
const msg_inject_on_complete = "inject_on_complete"

function make_recent_anchor(description, time, extended, shared, toread, tags, url, value) {
  if (noisy) { console.log('inject.js make_recent_anchor()'); }
  if (log_anchor_on_create) { console.log('log_anchor_on_create() description: ' + description); console.log('time: ' + time); console.log('extended: ' + extended); console.log('shared: ' + shared); console.log('toread: ' + toread); console.log('tags: ' + tags); console.log('url: ' + url); console.log('value: ' + value); }
  // var anchor = document.createElement('a');

  var clickable;
  if (typeof value === 'string') {
// console.log('value is string');
    var anchor = document.createElement('a');
    anchor.textContent = value;
    clickable = anchor;
  } else {
// console.log('value is object');
// console.dir(value);
    clickable = value;
    value = '';
  }

  if (recent_in_horizontal_menu) { clickable.setAttribute('class', 'pure-menu-link'); }
  $(clickable).click(event => {
    if (noisy) { console.log('make_recent_anchor anchor.click()'); console.dir(event); }
    event.preventDefault();
// console.dir(event.target);
// console.dir($(event.target)[0]);
// console.log('dt'+ $(event.target).hasClass('current_delete_tag'));
// console.log('nt'+ $(event.target).hasClass('current_normal_tag'));
    if ($(event.target).hasClass('current_normal_pin')) {
      $(event.target).attr('class', 'current_delete_pin');
    }
    else if ($(event.target).hasClass('current_normal_url')) {
      $(event.target).attr('class', 'current_block_url');
    }
    else if ($(event.target).hasClass('current_block_url')) {
      chrome.runtime.sendMessage(
        {
          action: msg_f2b_inhibit_url_append,
          inhibit: url
        },
        response => {
          if (noisy) { console.log('inject.js msg_f2b_inhibit_url_append response:'); console.dir(response); }
          $('#overlay').remove();
          // $(event.target).attr('class', 'current_normal_url');
          // refresh_it(url);
        }
      );

      // settings = new Store("settings");
      // let block = settings.get('inhibit');
      // block += '\n' + url;
      // settings.set('inhibit', block);
      // // load_site_ux(false, false);
      // refresh_it(url);

      // // Send a message to the active tab
      // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      //   if (noisy) { console.log('bg.js browserAction.onClicked'); }
      //   var activeTab = tabs[0];
      //   chrome.tabs.sendMessage(activeTab.id, {
      //     message: msg_b2f_block_url,
      //     url: url 
      //   });
      // });

    }
    else if ($(event.target).hasClass('current_delete_pin')) {
      if (noisy) { console.log('inject.js current_delete_pin click()'); }
      chrome.runtime.sendMessage(
        {
          action: msg_f2b_delete_pin,
          description: better_description(description, document.title),
          time: time,
          hash: "", /// hash,
          extended: extended,
          shared: shared,
          toread: toread,
          tags: tags,
          url: url,
          value: value
        },
        response => {
          if (noisy) { console.log('inject.js current_delete_pin response:'); console.dir(response); }
          $(event.target).attr('class', 'current_normal_pin');
          refresh_it(url);
        }
      );
    }
    else if ($(event.target).hasClass('current_normal_tag')) {
      $(event.target).attr('class', 'current_delete_tag');
    }
    else if ($(event.target).hasClass('current_delete_tag')) {
      $(event.target).attr('class', 'current_normal_tag');
      chrome.runtime.sendMessage(
        {
          action: msg_f2b_delete_tag,
          description: better_description(description, document.title),
          time: time,
          hash: "", /// hash,
          extended: extended,
          shared: shared,
          toread: toread,
          tags: tags,
          url: url,
          value: value
        },
        response => {
          if (noisy) { console.log('inject.js current_delete_tag click()'); console.dir(response); }
          refresh_it(url);
        }
      );
    }
    else {
      if (log_anchor_on_click) { console.log('description: ' + description); console.log('time: ' + time); console.log('extended: ' + extended); console.log('shared: ' + shared); console.log('toread: ' + toread); console.log('tags: ' + tags); console.log('url: ' + url); console.log('value: ' + value); }

      chrome.runtime.sendMessage(
        {
          action: msg_f2b_save_tag,
          description: better_description(description, document.title),
          time: time,
          hash: "", /// hash,
          extended: extended,
          shared: shared,
          toread: toread,
          tags: tags,
          url: url,
          value: value
        },
        response => {
          if (noisy) { console.log('inject.js make_recent_anchor anchor click()'); console.dir(response); }
          refresh_it(url);
        }
      );
    }
  });
  return clickable;
}
