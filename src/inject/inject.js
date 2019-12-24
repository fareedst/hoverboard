const current_in_horizontal_menu = false; // use: pure-menu pure-menu-horizontal pure-menu-scrollable
const recent_in_horizontal_menu =false; // use: pure-menu pure-menu-horizontal pure-menu-scrollable
const recent_as_list = true;
const recent_as_table = false;

// resources
//
const svg_action_production_ic_bookmark_24px = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTcgM0g3Yy0xLjEgMC0xLjk5LjktMS45OSAyTDUgMjFsNy0zIDcgM1Y1YzAtMS4xLS45LTItMi0yeiIvPjwvc3ZnPg==';
const svg_action_production_ic_delete_24px = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNNiAxOWMwIDEuMS45IDIgMiAyaDhjMS4xIDAgMi0uOSAyLTJWN0g2djEyek0xOSA0aC0zLjVsLTEtMWgtNWwtMSAxSDV2MmgxNFY0eiIvPjwvc3ZnPg==';
const svg_action_production_ic_track_changes_24px = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTkuMDcgNC45M2wtMS40MSAxLjQxQzE5LjEgNy43OSAyMCA5Ljc5IDIwIDEyYzAgNC40Mi0zLjU4IDgtOCA4cy04LTMuNTgtOC04YzAtNC4wOCAzLjA1LTcuNDQgNy03LjkzdjIuMDJDOC4xNiA2LjU3IDYgOS4wMyA2IDEyYzAgMy4zMSAyLjY5IDYgNiA2czYtMi42OSA2LTZjMC0xLjY2LS42Ny0zLjE2LTEuNzYtNC4yNGwtMS40MSAxLjQxQzE1LjU1IDkuOSAxNiAxMC45IDE2IDEyYzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00YzAtMS44NiAxLjI4LTMuNDEgMy0zLjg2djIuMTRjLS42LjM1LTEgLjk4LTEgMS43MiAwIDEuMS45IDIgMiAyczItLjkgMi0yYzAtLjc0LS40LTEuMzgtMS0xLjcyVjJoLTFDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMGMwLTIuNzYtMS4xMi01LjI2LTIuOTMtNy4wN3oiLz48L3N2Zz4=';
const svg_action_production_ic_visibility_off_24px = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgN2MyLjc2IDAgNSAyLjI0IDUgNSAwIC42NS0uMTMgMS4yNi0uMzYgMS44M2wyLjkyIDIuOTJjMS41MS0xLjI2IDIuNy0yLjg5IDMuNDMtNC43NS0xLjczLTQuMzktNi03LjUtMTEtNy41LTEuNCAwLTIuNzQuMjUtMy45OC43bDIuMTYgMi4xNkMxMC43NCA3LjEzIDExLjM1IDcgMTIgN3pNMiA0LjI3bDIuMjggMi4yOC40Ni40NkMzLjA4IDguMyAxLjc4IDEwLjAyIDEgMTJjMS43MyA0LjM5IDYgNy41IDExIDcuNSAxLjU1IDAgMy4wMy0uMyA0LjM4LS44NGwuNDIuNDJMMTkuNzMgMjIgMjEgMjAuNzMgMy4yNyAzIDIgNC4yN3pNNy41MyA5LjhsMS41NSAxLjU1Yy0uMDUuMjEtLjA4LjQzLS4wOC42NSAwIDEuNjYgMS4zNCAzIDMgMyAuMjIgMCAuNDQtLjAzLjY1LS4wOGwxLjU1IDEuNTVjLS42Ny4zMy0xLjQxLjUzLTIuMi41My0yLjc2IDAtNS0yLjI0LTUtNSAwLS43OS4yLTEuNTMuNTMtMi4yem00LjMxLS43OGwzLjE1IDMuMTUuMDItLjE2YzAtMS42Ni0xLjM0LTMtMy0zbC0uMTcuMDF6Ii8+PC9zdmc+';
const svg_av_production_ic_not_interested_24px = "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MiAwLTgtMy41OC04LTggMC0xLjg1LjYzLTMuNTUgMS42OS00LjlMMTYuOSAxOC4zMUMxNS41NSAxOS4zNyAxMy44NSAyMCAxMiAyMHptNi4zMS0zLjFMNy4xIDUuNjlDOC40NSA0LjYzIDEwLjE1IDQgMTIgNGM0LjQyIDAgOCAzLjU4IDggOCAwIDEuODUtLjYzIDMuNTUtMS42OSA0Ljl6Ii8+PC9zdmc+";
const svg_content_production_ic_clear_24px = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTkgNi40MUwxNy41OSA1IDEyIDEwLjU5IDYuNDEgNSA1IDYuNDEgMTAuNTkgMTIgNSAxNy41OSA2LjQxIDE5IDEyIDEzLjQxIDE3LjU5IDE5IDE5IDE3LjU5IDEzLjQxIDEyeiIvPjwvc3ZnPg==';
// const svg_content_production_ic_clear_24px_green = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KCTxnIGNvbG9yPSJncmVlbiI+CiAgCQk8cGF0aCBkPSJNMTkgNi40MUwxNy41OSA1IDEyIDEwLjU5IDYuNDEgNSA1IDYuNDEgMTAuNTkgMTIgNSAxNy41OSA2LjQxIDE5IDEyIDEzLjQxIDE3LjU5IDE5IDE5IDE3LjU5IDEzLjQxIDEyeiIvPgoJPC9nPgo8L3N2Zz4=';

var allit;

function better_description(description, document_title) {
  if (description == '' || description == 'no title') return document_title;
  return description;
}

function display_heading_tags() {
  if (noisy) { console.log('allit:');  console.dir(allit); }
  var tagstr = $('h1,h2,h3,h4').map(() => {
    return $(this).text();
  }).get();
  tagstr += ' ' + document.title;
  if (noisy) console.log('tagstr:' + tagstr);

  var tags = tagstr.replace(',', ' ').split(/([^\w]+)/).filter( e => e.length > 1);
  if (noisy) { console.log('tags'); console.dir(tags); }
  tags = tags.flatMap(s => (s == s.toLowerCase() ? [s] : [s, s.toLowerCase()]));
  if (noisy) { console.log('tags'); console.dir(tags); }
  oc = occurrence(tags);
  if (noisy) { console.log('oc'); console.dir(oc); }
  ok1 = Object.keys(oc).map(k => [k, oc[k].length]);
  if (noisy) { console.log('ok1'); console.dir(ok1); }
  ok2 = ok1.sort((a, b) => b[1] - a[1]);
  if (noisy) { console.log('ok2'); console.dir(ok2); }
  ok = ok2.map(x => x[0]);
  if (noisy) { console.log('ok'); console.dir(ok); }

  response = {
    action: "read_heading_tags",
    description: allit.description,
    time: allit.time,
    hash: allit.hash,
    extended: allit.extended,
    shared: allit.shared,
    toread: allit.toread,
    site_tags: Object.assign([], allit.site_tags),
    tags: Object.assign([], ok),
    url: allit.url
  };
  if (noisy) { console.log('inject.js read_heading_tags response:'); console.dir(response); }

  tablify_response('Headings:', response, allit.tags);
}

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
// console.log('in.js 316')
      if (response) {
// console.log('in.js 318')
        if (response.url) {
// console.log('in.js 320')
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

// console.log('tags.length:' + tags.length)
            let show = true;
// console.log('page_load:' + page_load)
// console.log('show:' + show)
            // show &= !page_load || (display_overlay_on_page_load_if_not_tagged || tags.length);
            show = show && (!page_load || !display_overlay_on_page_load_only_if_not_tagged || !tags.length);
// console.log('show:' + show)
            show = show && (!page_load || !display_overlay_on_page_load_only_if_tagged || !!tags.length);
// console.log('show:' + show)
            if (show) {
              place_in_header(document, make_site_tags_row_element(tags, allit));
    
              if (display_overlay_recent) {
                chrome.runtime.sendMessage(
                  allit,
                  response => {
                    // if (noisy) { console.log('inject.js read_recent_tags response cb()'); console.dir(response); }
                    console.log('inject.js read_recent_tags response cb()'); console.dir(response);
                    if (response) {
                      console.log('inject.js read_recent_tags response cb()');
                      tablify_response('Recent:', response, tags);
                      if (display_overlay_headings) {
                        console.log('inject.js read_recent_tags response cb()');
                        display_heading_tags();
                      }
                    }
                  }
                );
              }
              else {
                console.log('inject.js read_recent_tags response cb()');
                if (display_overlay_headings) {
                  console.log('inject.js read_recent_tags response cb()');
                  display_heading_tags();
                }
              }
            }
          }
        } else {
// console.log('in.js 372')
          cell = document.createElement('span');
          cell.textContent = "Credentials missing!";
          place_in_header(document, cell);
        }
      }
    }
  );
// console.log('in.js 380')
}

function make_site_tags_row_element(arr, allit) {
  if (log_make_site_tags_row_element) { console.log('inject.js make_site_tags_row_element allit:'); console.dir(allit); }
  const pin_tags_as_list = true;
  let container;
  let main;
  if (pin_tags_as_list) {
    var table = document.createElement('div');
    table.setAttribute('class', 'scrollmenu');
    container = table;
    main = table;
  } else {
    var table = document.createElement('table');
    // table.setAttribute('width', '50%');
    // table.setAttribute('width', '32em');
    table.setAttribute('class', 'pure-table pure-table-horizontal');
    var tbody = document.createElement('tbody');
    tbody.setAttribute('class', '');
    var tr1 = document.createElement('tr');
    tr1.setAttribute('class', 'pure-table-odd');
    tbody.appendChild(tr1);
    table.appendChild(tbody);
    container = tr1;
    main = table;
  }

  if (ux_recent_row_with_close_button) {
    let img = document.createElement('img');
    $(img).attr('src', 'data:image/svg+xml;base64,' + svg_content_production_ic_clear_24px);
    $(img).attr('class', 'svg-hot');

    $(img).click(event => {
      if (noisy) console.log('inject.js make_site_tags_row_element img.click()');
      event.preventDefault();
      $('#overlay').remove();
    });

    if (pin_tags_as_list) {
      let cell = document.createElement('span');
      cell.setAttribute('class', 'tiny');
      cell.appendChild(img);
      container.appendChild(cell);
    } else {
      let td1 = document.createElement('td');
      td1.appendChild(img);
      container.appendChild(td1);
    }
  }

  if (ux_recent_row_with_delete_pin) {
    if (allit.hash != '') {
      let img = document.createElement('img');
      $(img).attr('src', 'data:image/svg+xml;base64,' + svg_action_production_ic_delete_24px);
      // $(img).attr('class', allit.toread === 'yes' ? 'svg-hot' : 'svg-cold');

      value = img;
      tag = make_recent_anchor(allit.description, allit.time, allit.extended, allit.shared, allit.toread, allit.tags, allit.url, value);
      $(tag).attr('class', 'current_normal_pin');

      if (pin_tags_as_list) {
        let cell = document.createElement('span');
        cell.setAttribute('class', 'tiny');
        cell.appendChild(tag);
        container.appendChild(cell);
      } else {
        let td1 = document.createElement('td');
        td1.appendChild(tag);  
        container.appendChild(td1);
      }
    }
  }

  if (ux_recent_row_with_private_button) {
    let img = document.createElement('img');
    $(img).attr('src', 'data:image/svg+xml;base64,' + svg_action_production_ic_visibility_off_24px);
    $(img).attr('class', allit.shared === 'no' ? 'svg-hot' : 'svg-cold');

    let shared = (allit.shared === 'no' ? 'yes' : 'no');
    value = img;
    tag = make_recent_anchor(allit.description, allit.time, allit.extended, shared, allit.toread, allit.tags, allit.url, value);

    if (pin_tags_as_list) {
      let cell = document.createElement('span');
      cell.setAttribute('class', 'tiny');
      cell.appendChild(tag);
      container.appendChild(cell);
    } else {
      let td1 = document.createElement('td');
      td1.appendChild(tag);  
      container.appendChild(td1);
    }
  }

  if (ux_recent_row_with_bookmark_button) {
    let img = document.createElement('img');
    $(img).attr('src', 'data:image/svg+xml;base64,' + svg_action_production_ic_bookmark_24px);
    $(img).attr('class', allit.toread === 'yes' ? 'svg-hot' : 'svg-cold');

    let toread = (allit.toread === 'yes' ? 'no' : 'yes');
    value = img;
    tag = make_recent_anchor(allit.description, allit.time, allit.extended, allit.shared, toread, allit.tags, allit.url, value);

    if (pin_tags_as_list) {
      let cell = document.createElement('span');
      cell.setAttribute('class', 'tiny');
      cell.appendChild(tag);
      container.appendChild(cell);
    } else {
      let td1 = document.createElement('td');
      td1.appendChild(tag);  
      container.appendChild(td1);
    }
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
          return true; // keep port open
        }
    });
    container.appendChild(input);
  }

  if (ux_recent_row_with_block) {
    let img = document.createElement('img');
    $(img).attr('src', 'data:image/svg+xml;base64,' + svg_av_production_ic_not_interested_24px);
    $(img).attr('class', 'current_normal_url');
    // $(img).attr('class', allit.toread === 'yes' ? 'svg-hot' : 'svg-cold');

    // let toread = (allit.toread === 'yes' ? 'no' : 'yes');
    value = img;
    tag = make_recent_anchor(allit.description, allit.time, allit.extended, allit.shared, allit.toread, allit.tags, allit.url, value);

    if (pin_tags_as_list) {
      let cell = document.createElement('span');
      cell.setAttribute('class', 'tiny');
      cell.appendChild(tag);
      container.appendChild(cell);
    } else {
      let td1 = document.createElement('td');
      td1.appendChild(tag);  
      container.appendChild(td1);
    }
  }

  if (false) {
    let img = document.createElement('img');
    $(img).attr('src', 'data:image/svg+xml;base64,' + svg_action_production_ic_bookmark_24px);
    $(img).attr('class', allit.toread === 'yes' ? 'svg-hot' : 'svg-cold');
    // let button = document.createElement('button');
    $(img).attr('id', 'go-to-options');

    if (pin_tags_as_list) {
      let cell = document.createElement('span');
      cell.setAttribute('class', 'tiny');
      cell.appendChild(img);
      container.appendChild(cell);
    } else {
      let td1 = document.createElement('td');
      td1.appendChild(img);  
      container.appendChild(td1);
    }

    $(img)[0].addEventListener('click', event => {
      event.preventDefault();
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('src/options_custom/index.html'));
      }
    });
  }

  let td = document.createElement('span');
  td.setAttribute('class', 'tiny');
  td.textContent = 'Current:';
  // $(td).attr('class', 'row_heading');
  if (pin_tags_as_list) {
    let cell = document.createElement('span');
    cell.setAttribute('class', 'tiny');
    cell.appendChild(td);
    container.appendChild(cell);
  } else {
    let td1 = document.createElement('td');
    td1.appendChild(td);
    container.appendChild(td1);
  }

  arr.forEach((value, index) => {
    let td1 = document.createElement('td');
    // $(td1).attr('class', 'current_normal_tag');
    if (typeof value === 'string') {
      // td1.textContent = value;
      tag = make_recent_anchor(allit.description, allit.time, allit.extended, allit.shared, allit.toread, allit.site_tags, allit.url, value);
      $(tag).attr('class', 'current_normal_tag');
      if (pin_tags_as_list) {
        let cell = document.createElement('span');
        cell.setAttribute('class', 'tiny');
        cell.appendChild(tag);
        container.appendChild(cell);
      } else {
        // let td1 = document.createElement('td');
        td1.appendChild(tag);  
        container.appendChild(td1);
      }
    } else {
      if (pin_tags_as_list) {
        let cell = document.createElement('span');
        cell.setAttribute('class', 'tiny');
        cell.appendChild(value);
        container.appendChild(cell);
      } else {
        let td1 = document.createElement('td');
        td1.appendChild(value);  
        container.appendChild(td1);
      }
    }
  });
  // tbody.appendChild(tr1);
  // table.appendChild(tbody);

  // // #tags
  // var tags_div = document.createElement('div');
  // tags_div.setAttribute('id', 'tags_div');
  // if (current_in_horizontal_menu) { tags_div.setAttribute('class', 'custom-menu-horizontal pure-menu pure-menu-horizontal pure-menu-scrollable'); }
  // // if (current_in_horizontal_menu) { tags_div.setAttribute('class', 'pure-u-1 pure-menu-heading'); }
  // td1.appendChild(tags_div);
  return main;
}

function occurrence(array) {
    "use strict";
    var result = {};
    if (array instanceof Array) {
        array.forEach((v, i) => {
            if (!result[v]) {
                result[v] = [i];
            } else {
                result[v].push(i);
            }
        });
        Object.keys(result).forEach(v => {
            result[v] = {"index": result[v], "length": result[v].length};
        });
    }
    return result;
};

const header_as_div = true;

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
  } else if (header_as_div) {
    header = doc.createElement('div');
    header.setAttribute('id', 'overlay');
    if (noisy) { console.dir($('body')); }
    $('body')[0].appendChild(header);
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

  if (header_as_div) {
    wrap = doc.createElement('div');
    wrap.appendChild(list);
    header.appendChild(wrap);
  } else {
    wrap = doc.createElement('tr');
    wrap2 = doc.createElement('td');
    wrap2.appendChild(list);
    wrap.appendChild(wrap2);
    header.appendChild(wrap);    
  }

  if (noisy) { console.log('<- place_in_header()'); }
}

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

function refresh_it(url) {
  if (noisy) { console.log('refresh_it()'); }

  $('#overlay').remove();
  load_site_ux(false, false);
}

function tablify_into_container(response, container, known_list) {
  if (noisy) {
    console.log('inject.js tablify_into_container() response:'); console.dir(response);
    console.log('container:'); console.dir(container);
    console.log('known_list:'); console.dir(known_list);
  }
  var tags = response.tags;
  var added = 0;
  // var dlisst = [];  
  tags.forEach((value, index) => {
    if (noisy) {
      console.log('inject.js read_recent_tags response cb() tags ' + index + ':' + value);
      console.log('recent_tags_count_max: ' + recent_tags_count_max.toString());
    }
    if (added < recent_tags_count_max) {

      // var known_list = []; ///tags ? tags.split(' ') : [];
      // var curr_tags, url;

      const matched = (known_list.indexOf(value) >= 0);
      if (matched) {
        if (noisy) console.log('is matched');
      } else {
        if (noisy) console.log('is new');
        added++;
        var cell;
        if (recent_as_list) {
          cell = document.createElement('span');
          cell.setAttribute('class', 'tiny');
        }
        else if (recent_as_table) {
          cell = document.createElement('td');
        } else {
          cell = document.createElement('li');
        }
        container.appendChild(cell);

        if (recent_in_horizontal_menu) { cell.setAttribute('class', 'pure-menu-item'); }

        var tag;
        if (true) {
          // console.log('allit:');
          // console.dir(allit);
          tag = make_recent_anchor(response.description, response.time, response.extended, response.shared, response.toread, response.site_tags, response.url, value);
        }
        else {
          if (noisy) console.log('make_tag_text()');
          // console.log('description: ' + description); // console.log('time: ' + time); // console.log('extended: ' + extended); // console.log('shared: ' + shared); // console.log('toread: ' + toread); // console.log('tags: ' + tags); // console.log('url: ' + url); // console.log('value: ' + value);
          tag = document.createElement('div');
          // if (recent_in_horizontal_menu) { tag.setAttribute('class', 'pure-menu-link'); }
          tag.textContent = value;
        }
        if (noisy) {
          console.log('tag:'); console.dir(tag);
          console.log('cell:'); console.dir(cell);
        }

        cell.appendChild(tag)
        // dlisst.push(value);
      }
    }
  });
}

function tablify_response(name, response, known_list) {
  var tags = response.tags;
  if (noisy) { console.log('tags:'); console.dir(tags); }
  if (noisy) { console.log('tags_html:'); console.dir(response.tags_html); }

  if (tags && tags.length > 0) {
    if (noisy) { console.log('inject.js read_recent_tags response cb() tags'); }

    var container;
    var major;
    if (recent_as_list) {
      container = document.createElement('div');
      container.setAttribute('class', 'scrollmenu');
      major = container;
    } else if (recent_as_table) {
      var table = document.createElement('table');
      table.setAttribute('class', 'pure-table pure-table-horizontal');
      var tbody = document.createElement('tbody');
      tbody.setAttribute('class', '');
      var tr1 = document.createElement('tr');
      tr1.setAttribute('class', 'pure-table-odd');
      tbody.appendChild(tr1);
      table.appendChild(tbody);

      var td = document.createElement('td');
      $(td).attr('class', 'row_heading');
      td.textContent = name;
      tr1.appendChild(td);

      container = tr1;
      major = table;
    } else {
      container = document.createElement('ul');
      major = container;
    }
    container.setAttribute('id', 'recent_list');
    if (recent_in_horizontal_menu) { container.setAttribute('class', 'pure-menu-list'); }
    // var known_list = [];
    tablify_into_container(response, container, known_list);
    place_in_header(document, major);
  }
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

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.message === msg_b2f_clicked_browser_action) {
      if (false) {
        $("#overlay").toggle(); 
      } else if ($('#overlay').length) {
        $('#overlay').remove();
      } else {
        /// load without block list
        load_site_ux(false, false);
      }
    }
    else {
      console.error('unrecognized request.message: ' + request.message);
    }
  }
);
