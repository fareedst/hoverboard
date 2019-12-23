const current_in_horizontal_menu = false; // use: pure-menu pure-menu-horizontal pure-menu-scrollable
const recent_in_horizontal_menu =false; // use: pure-menu pure-menu-horizontal pure-menu-scrollable
const recent_as_table = true;

// resources
//
const svg_action_production_ic_bookmark_24px = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTcgM0g3Yy0xLjEgMC0xLjk5LjktMS45OSAyTDUgMjFsNy0zIDcgM1Y1YzAtMS4xLS45LTItMi0yeiIvPjwvc3ZnPg==';
const svg_action_production_ic_delete_24px = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNNiAxOWMwIDEuMS45IDIgMiAyaDhjMS4xIDAgMi0uOSAyLTJWN0g2djEyek0xOSA0aC0zLjVsLTEtMWgtNWwtMSAxSDV2MmgxNFY0eiIvPjwvc3ZnPg==';
const svg_action_production_ic_track_changes_24px = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTkuMDcgNC45M2wtMS40MSAxLjQxQzE5LjEgNy43OSAyMCA5Ljc5IDIwIDEyYzAgNC40Mi0zLjU4IDgtOCA4cy04LTMuNTgtOC04YzAtNC4wOCAzLjA1LTcuNDQgNy03LjkzdjIuMDJDOC4xNiA2LjU3IDYgOS4wMyA2IDEyYzAgMy4zMSAyLjY5IDYgNiA2czYtMi42OSA2LTZjMC0xLjY2LS42Ny0zLjE2LTEuNzYtNC4yNGwtMS40MSAxLjQxQzE1LjU1IDkuOSAxNiAxMC45IDE2IDEyYzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00YzAtMS44NiAxLjI4LTMuNDEgMy0zLjg2djIuMTRjLS42LjM1LTEgLjk4LTEgMS43MiAwIDEuMS45IDIgMiAyczItLjkgMi0yYzAtLjc0LS40LTEuMzgtMS0xLjcyVjJoLTFDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMGMwLTIuNzYtMS4xMi01LjI2LTIuOTMtNy4wN3oiLz48L3N2Zz4=';
const svg_action_production_ic_visibility_off_24px = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgN2MyLjc2IDAgNSAyLjI0IDUgNSAwIC42NS0uMTMgMS4yNi0uMzYgMS44M2wyLjkyIDIuOTJjMS41MS0xLjI2IDIuNy0yLjg5IDMuNDMtNC43NS0xLjczLTQuMzktNi03LjUtMTEtNy41LTEuNCAwLTIuNzQuMjUtMy45OC43bDIuMTYgMi4xNkMxMC43NCA3LjEzIDExLjM1IDcgMTIgN3pNMiA0LjI3bDIuMjggMi4yOC40Ni40NkMzLjA4IDguMyAxLjc4IDEwLjAyIDEgMTJjMS43MyA0LjM5IDYgNy41IDExIDcuNSAxLjU1IDAgMy4wMy0uMyA0LjM4LS44NGwuNDIuNDJMMTkuNzMgMjIgMjEgMjAuNzMgMy4yNyAzIDIgNC4yN3pNNy41MyA5LjhsMS41NSAxLjU1Yy0uMDUuMjEtLjA4LjQzLS4wOC42NSAwIDEuNjYgMS4zNCAzIDMgMyAuMjIgMCAuNDQtLjAzLjY1LS4wOGwxLjU1IDEuNTVjLS42Ny4zMy0xLjQxLjUzLTIuMi41My0yLjc2IDAtNS0yLjI0LTUtNSAwLS43OS4yLTEuNTMuNTMtMi4yem00LjMxLS43OGwzLjE1IDMuMTUuMDItLjE2YzAtMS42Ni0xLjM0LTMtMy0zbC0uMTcuMDF6Ii8+PC9zdmc+';
const svg_av_production_ic_not_interested_24px = "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MiAwLTgtMy41OC04LTggMC0xLjg1LjYzLTMuNTUgMS42OS00LjlMMTYuOSAxOC4zMUMxNS41NSAxOS4zNyAxMy44NSAyMCAxMiAyMHptNi4zMS0zLjFMNy4xIDUuNjlDOC40NSA0LjYzIDEwLjE1IDQgMTIgNGM0LjQyIDAgOCAzLjU4IDggOCAwIDEuODUtLjYzIDMuNTUtMS42OSA0Ljl6Ii8+PC9zdmc+";
const svg_content_production_ic_clear_24px = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTkgNi40MUwxNy41OSA1IDEyIDEwLjU5IDYuNDEgNSA1IDYuNDEgMTAuNTkgMTIgNSAxNy41OSA2LjQxIDE5IDEyIDEzLjQxIDE3LjU5IDE5IDE5IDE3LjU5IDEzLjQxIDEyeiIvPjwvc3ZnPg==';
// const svg_content_production_ic_clear_24px_green = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxnIGNvbG9yPSJncmVlbiI+CiAgCQk8cGF0aCBkPSJNMTkgNi40MUwxNy41OSA1IDEyIDEwLjU5IDYuNDEgNSA1IDYuNDEgMTAuNTkgMTIgNSAxNy41OSA2LjQxIDE5IDEyIDEzLjQxIDE3LjU5IDE5IDE5IDE3LjU5IDEzLjQxIDEyeiIvPgoJPC9nPgo8L3N2Zz4=';

async function read_local_settings() {
  if (noisy_settings) { console.log('read_local_settings()'); }
  return new Promise(async (resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: msg_f2b_read_options },
      response => {
        if (noisy_settings) { console.log('msg_f2b_read_options response:'); console.dir(response); }
        resolve(response);
      }
    );
  });
}

chrome.extension.sendMessage(
  { action: msg_inject_on_complete },
  response => {
  	const readyStateCheckInterval = setInterval(async () => {
    	if (document.readyState === "complete") {
    		clearInterval(readyStateCheckInterval);
    		if (noisy) { console.log("Hello. This message was sent from scripts/inject.js"); console.dir(document); }

        await new Promise(async (resolve, reject) => {
          let auth_settings = await read_local_settings();
          if (noisy_auth) { console.log('msg_inject_on_complete auth_settings:'); console.dir(auth_settings); }

          // chrome.runtime.sendMessage(
          //   { action: msg_f2b_inhibit_url_append,
          //     inhibit: '1' },
          //   response => {
          //     if (noisy_settings) { console.log('msg_f2b_inhibit_url_append response:'); console.dir(response); }
          //     resolve(response);
          //   }
          // );

          // chrome.runtime.sendMessage(
          //   { action: msg_f2b_read_pin },
          //   response => {
          //     if (noisy_settings) { console.log('msg_f2b_read_pin response:'); console.dir(response); }
          //     resolve(response);
          //   }
          // );

          if (log_version_on_page_load) {
            let manifestData = chrome.runtime.getManifest();
            console.log(manifestData.name + ' version: ' + manifestData.version);
            // console.log(manifestData.default_locale);
          }
          if (noisy) { console.dir(response); }

          if (noisy) { console.log('inject.js sendMessage document complete'); }
          if (noisy) { console.log(document.location.href.replace(/#.#$/, '')); }
          // chrome.pageAction.show(sender.tab.id);

          if (log_site_url_on_site_load) console.log('url: ' + document.location.href);

          if (display_overlay_on_page_load) {
            load_site_ux(true, inhibit_sites_on_page_load);
          }
          resolve();
        });
      }
    }, 10);
  }
);

var allit;

function load_site_ux(page_load, use_block) {
  if (noisy) { console.log('inject.js load_site_ux(page_load: ' + page_load + ', use_block: ' + use_block + ')'); }
  chrome.runtime.sendMessage(
    {
      action: msg_f2b_read_current,
      title: document.title,
      use_block: use_block
    },
    response => {
      if (log_read_current_response) { console.log('log_read_current_response:'); console.dir(response); }
      if (noisy) { console.log('inject.js load_site_ux read_current_url cb()\nresponse:'); console.dir(response); }
console.log('in.js 316')
      if (response) {
console.log('in.js 318')
        if (response.url) {
console.log('in.js 320')
          var tags = response.tags;
          if (log_title_on_pin_load) { console.log('log_title_on_pin_load: ' + response.description); }
          if (tags) {
            allit = {
              action: msg_f2b_read_recent,
              description: response.description,
              time: response.time,
              hash: response.hash,
              extended: response.extended,
              shared: response.shared,
              toread: response.toread,
              site_tags: Object.assign([], response.tags),
              tags: Object.assign([], response.tags),
              url: response.url
            };
            if (noisy) { console.log('inject.js read_recent_tags allit:'); console.dir(allit); }

console.log('tags.length:' + tags.length)
            let show = true;
console.log('page_load:' + page_load)
console.log('show:' + show)
            // show &= !page_load || (display_overlay_on_page_load_if_not_tagged || tags.length);
            show = show && (!page_load || !display_overlay_on_page_load_only_if_not_tagged || !tags.length);
console.log('show:' + show)
            show = show && (!page_load || !display_overlay_on_page_load_only_if_tagged || !!tags.length);
console.log('show:' + show)
            if (show) {
              place_in_header(document, make_site_tags_row_element(tags, allit));
    
              if (display_overlay_recent) {
                chrome.runtime.sendMessage(
                  allit,
                  response => {
                    if (noisy) { console.log('inject.js read_recent_tags response cb()'); console.dir(response); }
                    if (response) {
                      tablify_response('Recent:', response, tags);
                      if (display_overlay_headings) {
                        display_heading_tags();
                      }
                    }
                  }
                );
              }
              else {
                if (display_overlay_headings) {
                  display_heading_tags();
                }
              }
            }
          }
        } else {
console.log('in.js 372')
          cell = document.createElement('span');
          cell.textContent = "Credentials missing!";
          place_in_header(document, cell);
        }
      }
    }
  );
console.log('in.js 380')
}

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
          action: msg_f2b_block_url,
          url: url
        },
        response => {
          if (noisy) { console.log('inject.js msg_f2b_block_url response:'); console.dir(response); }
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
          if (noisy) { console.log('inject.js current_delete_pin click()'); console.dir(response); }
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

function make_site_tags_row_element(arr, allit) {
  if (log_make_site_tags_row_element) { console.log('inject.js make_site_tags_row_element allit:'); console.dir(allit); }
  var table = document.createElement('table');
  // table.setAttribute('width', '50%');
  // table.setAttribute('width', '32em');
  table.setAttribute('class', 'pure-table pure-table-horizontal');
  var tbody = document.createElement('tbody');
  tbody.setAttribute('class', '');
  var tr1 = document.createElement('tr');
  tr1.setAttribute('class', 'pure-table-odd');

  if (ux_recent_row_with_close_button) {
    let img = document.createElement('img');
    $(img).attr('src', 'data:image/svg+xml;base64,' + svg_content_production_ic_clear_24px);
    $(img).attr('class', 'svg-hot');
    let td1 = document.createElement('td');

    $(img).click(event => {
      if (noisy) console.log('inject.js make_site_tags_row_element img.click()');
      event.preventDefault();
      $('#overlay').remove();
    });
    td1.appendChild(img);

    tr1.appendChild(td1);
  }

  if (ux_recent_row_with_delete_pin) {
    if (allit.hash != '') {
      let img = document.createElement('img');
      $(img).attr('src', 'data:image/svg+xml;base64,' + svg_action_production_ic_delete_24px);
      // $(img).attr('class', allit.toread === 'yes' ? 'svg-hot' : 'svg-cold');
      let td1 = document.createElement('td');
  
      value = img;
      tag = make_recent_anchor(allit.description, allit.time, allit.extended, allit.shared, allit.toread, allit.tags, allit.url, value);
      $(tag).attr('class', 'current_normal_pin');
      td1.appendChild(tag);
  
      tr1.appendChild(td1);
    }
  }

  if (ux_recent_row_with_private_button) {
    let img = document.createElement('img');
    $(img).attr('src', 'data:image/svg+xml;base64,' + svg_action_production_ic_visibility_off_24px);
    $(img).attr('class', allit.shared === 'no' ? 'svg-hot' : 'svg-cold');
    let td1 = document.createElement('td');

    let shared = (allit.shared === 'no' ? 'yes' : 'no');
    value = img;
    tag = make_recent_anchor(allit.description, allit.time, allit.extended, shared, allit.toread, allit.tags, allit.url, value);
    td1.appendChild(tag);

    tr1.appendChild(td1);
  }

  if (ux_recent_row_with_bookmark_button) {
    let img = document.createElement('img');
    $(img).attr('src', 'data:image/svg+xml;base64,' + svg_action_production_ic_bookmark_24px);
    $(img).attr('class', allit.toread === 'yes' ? 'svg-hot' : 'svg-cold');
    let td1 = document.createElement('td');

    let toread = (allit.toread === 'yes' ? 'no' : 'yes');
    value = img;
    tag = make_recent_anchor(allit.description, allit.time, allit.extended, allit.shared, toread, allit.tags, allit.url, value);
    td1.appendChild(tag);

    tr1.appendChild(td1);
  }

  if (ux_recent_row_with_input) {
    // let form = document.createElement('form');
    let input = document.createElement('input');
    // form.appendChild(input);
    $(input).attr('autocomplete', 'on');
    $(input).attr('maxlength', '26');
    $(input).attr('size', '6');
    $(input).attr('type', 'text');
    $(input)[0].addEventListener("keyup", event => {
        if (event.keyCode === 13) {
          // alert($(input).val());
          let text = $(input).val();
          let updated = Object.assign(
            allit,
            {
              action: msg_f2b_save_tag,
              description: better_description(allit.description, document.title),
              value: text
            }
          );
          // console.log('updated:'); console.dir(updated);

          chrome.runtime.sendMessage(
            updated,
            response => {
              if (noisy) { console.log('inject.js make_recent_anchor anchor click()'); console.dir(response); }
              refresh_it(allit.url);
            }
          );
          return false;
        }
    });
    tr1.appendChild(input);
  }

  if (true) { // ux_recent_row_with_block
    let img = document.createElement('img');
    $(img).attr('src', 'data:image/svg+xml;base64,' + svg_av_production_ic_not_interested_24px);
    $(img).attr('class', 'current_normal_url');
    // $(img).attr('class', allit.toread === 'yes' ? 'svg-hot' : 'svg-cold');
    let td1 = document.createElement('td');

    // let toread = (allit.toread === 'yes' ? 'no' : 'yes');
    value = img;
    tag = make_recent_anchor(allit.description, allit.time, allit.extended, allit.shared, allit.toread, allit.tags, allit.url, value);
    td1.appendChild(tag);

    tr1.appendChild(td1);
  }

  if (false) {
    let td1 = document.createElement('td');

    let img = document.createElement('img');
    $(img).attr('src', 'data:image/svg+xml;base64,' + svg_action_production_ic_bookmark_24px);
    $(img).attr('class', allit.toread === 'yes' ? 'svg-hot' : 'svg-cold');
    // let button = document.createElement('button');
    $(img).attr('id', 'go-to-options');
    td1.appendChild(img);

    tr1.appendChild(td1);    

    $(img)[0].addEventListener('click', event => {
      event.preventDefault();
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('src/options_custom/index.html'));
      }
    });
  }

  let td = document.createElement('td');
  td.textContent = 'Current:';
  $(td).attr('class', 'row_heading');
  tr1.appendChild(td);

  arr.forEach((value, index) => {
    let td1 = document.createElement('td');
    // $(td1).attr('class', 'current_normal_tag');
    if (typeof value === 'string') {

      // td1.textContent = value;
      tag = make_recent_anchor(allit.description, allit.time, allit.extended, allit.shared, allit.toread, allit.site_tags, allit.url, value);
      $(tag).attr('class', 'current_normal_tag');
      td1.appendChild(tag);

    } else {
      td1.appendChild(value);
    }
    tr1.appendChild(td1);
  });
  tbody.appendChild(tr1);
  table.appendChild(tbody);

  // // #tags
  // var tags_div = document.createElement('div');
  // tags_div.setAttribute('id', 'tags_div');
  // if (current_in_horizontal_menu) { tags_div.setAttribute('class', 'custom-menu-horizontal pure-menu pure-menu-horizontal pure-menu-scrollable'); }
  // // if (current_in_horizontal_menu) { tags_div.setAttribute('class', 'pure-u-1 pure-menu-heading'); }
  // td1.appendChild(tags_div);
  return table;
}

function place_in_header(doc, list) {
  // var body = $('body');
  if (noisy) { console.log('place_in_header()'); }
  if (noisy) { console.dir(doc); }
  if (noisy) { console.dir(list); }
  // var body = document.body;
  var ov = $(doc).find("#overlay");
  if (noisy) { console.dir(ov); }
  var header;
  if (ov.length === 1) {
    header = ov[0];
  } else {
    // header = doc.createElement('div');
    header = doc.createElement('table');
    header.setAttribute('id', 'overlay');
    if (noisy) { console.dir($('body')); }
    $('body')[0].appendChild(header);

    // // hide panel
    // // $("#overlay").click(function(){
    // $(header).click(() => {
    //   // $("#overlay").css('display', 'none');
    //   $("#overlay").remove();
    // });
  }
  if (noisy) { console.dir(header); }

  // header.appendChild(list);

  // wrap = doc.createElement('div');
  // wrap.appendChild(list);
  // header.appendChild(wrap);

  wrap = doc.createElement('tr');
  wrap2 = doc.createElement('td');
  wrap2.appendChild(list);
  wrap.appendChild(wrap2);
  header.appendChild(wrap);
  if (noisy) { console.log('<- place_in_header()'); }
}
