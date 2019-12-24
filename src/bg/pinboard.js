if (noisy) { console.log("src/bg/pinboard.js load"); }

// const current_in_horizontal_menu = true; // use: pure-menu pure-menu-horizontal pure-menu-scrollable
const recent_in_horizontal_menu = true; // use: pure-menu pure-menu-horizontal pure-menu-scrollable

// function make_recent_anchor(description, time, extended, shared, toread, tags, url, value) {
//   if (noisy) { console.log('make_recent_anchor()'); }
//   // console.log('description: ' + description); // console.log('time: ' + time); // console.log('extended: ' + extended); // console.log('shared: ' + shared); // console.log('toread: ' + toread); // console.log('tags: ' + tags); // console.log('url: ' + url); // console.log('value: ' + value);
//   var anchor = document.createElement('a');
//   if (recent_in_horizontal_menu) { anchor.setAttribute('class', 'pure-menu-link'); }
//   if (typeof value === 'string') {
//     anchor.textContent = value;
//   } else {
//     anchor.appendChild(value);
//     value = "";
//   }

//   $(anchor).click(event => {
//     if (noisy) { console.log('make_recent_anchor anchor.click()'); }
//     if (noisy) { console.dir(event); }
//     event.preventDefault();

//     chrome.runtime.sendMessage(
//       {
//         action: msg_f2b_save_tag,
//         description: description,
//         time: time,
//         hash: "", /// hash,
//         extended: extended,
//         shared: shared,
//         toread: toread,
//         tags: tags,
//         url: url,
//         value: value
//       },
//       response => {
//         if (noisy) { console.log('pinboard.js make_recent_anchor anchor click()'); console.dir(response); }
//       }
//     );
//   });
//   return anchor;
// }

class Pb {
  description;
  hash;
  time;
  extended;
  tag;
  tags;
  shared;
  toread;
  url;

  getPost = () => {
    if (noisy) { console.log('Pb.getPost() this: '); }
    if (noisy) { console.dir(this); }
    if (noisy) { console.dir(Object.keys(this)); }
    return {
      description: this.description,
      time: this.time,
      hash: this.hash,
      extended: this.extended,
      tags: Object.assign([], this.tags),
      shared: this.shared,
      toread: this.toread,
      url: this.url
    };
  };

  constructor(url) {
    if (noisy) { console.log("Pb(url: " + url + ")"); }
    this.url = url;
    let _api_path = 'https://api.pinboard.in/v1/';
    let _description;
    let _url = url;

    this.getApiPath = () => _api_path;
    // this.getAuthTokenSet = () => _auth_token_set;
    this.getAuthTokenSet = () => auth_token_set();

    this.getPostsUrl = () =>
      this.getApiPath() + "posts/get?url=" + this.getUrl() + "&" + this.getAuthTokenSet();

    this.getRecentUrl = () =>
      this.getApiPath() + "posts/recent?count=32&" + this.getAuthTokenSet();

    this.getUrl = () => { return _url; };

    this.hasAuth = () => auth_token_exists();

    this.storePost = resPost => {
      if (noisy) { console.log('Pb.storePost() this: '); }
      if (noisy) { console.dir(this); }
      if (log_pin_on_store) { console.log('log_pin_on_store:'); console.dir(resPost); }
      if (noisy) { console.dir(resPost.description); }
      this.description = resPost.description;
      this.hash = resPost.hash;
      this.time = resPost.time;
      this.extended = resPost.extended;
      this.tag = resPost.tag;
      this.tags = resPost.tags;
      this.shared = resPost.shared;
      this.toread = resPost.toread;
      this.url = resPost.url;
      if (noisy) { console.log('Pb.storePost() after: '); }
      if (noisy) { console.dir(this); }
    };
  }

  read_recent = async (description, time, extended, shared, tags, toread, url) => {
    const self = this;
    return new Promise( (resolve, reject) => {
      var pinurl = this.getRecentUrl();
      if (noisy) { console.log("read_recent() pinurl: " + pinurl); }
      var xhr = new XMLHttpRequest(); 
      xhr.open('GET', pinurl, true);
      xhr.onreadystatechange = async event => {
        if (noisy) { console.log('pinboard.js read_recent() xhr.onreadystatechange()'); }
        if (noisy) { console.log(event); }
        if (noisy) { console.log(this); }
        if (noisy) { console.log(self); }
        if (event.target.readyState == 4 && event.target.status == 200) {
          if (noisy) { console.log(xhr.responseURL); }
          var data = xhr.responseXML;
          if (noisy) { console.log(data); }

          // var description, time, extended, shared, tags, toread;

          var known_list = tags ? ((typeof tags == 'string') ? tags.split(' ') : tags) : [];
          var suggested_list = new Array();
          // var time = data.getElementsByTagName('posts')[0].getAttribute('time');
          var posts = data.getElementsByTagName("post");

          const tags_list = posts_get_tags(posts);
          if (noisy) { console.dir(tags_list); }
          // resolve(tags_list.sort(compare).map(x => x.));
          // resolve(tags_list);

          var last_tags;
          if (tags_list.length > 0) {
            var dlisst = [];
            var list = document.createElement('ul');
            list.setAttribute('id', 'recent_list');
            if (recent_in_horizontal_menu) { list.setAttribute('class', 'pure-menu-list'); }
            var added = 0;
            tags_list.forEach((value, index) => {
              if (added < recent_tags_count_max) {
                const matched = (known_list.indexOf(value) >= 0);
                if (!matched) {
                  added++;
                  var li = document.createElement('li');
                  if (recent_in_horizontal_menu) { li.setAttribute('class', 'pure-menu-item'); }

                  var tag;
                  if (true) {
                    tag = make_recent_anchor(description, time, extended, shared, toread, tags, url, value);
                  }
                  else {
                    if (noisy) { console.log('make_tag_text()'); }
                    // console.log('description: ' + description); // console.log('time: ' + time); // console.log('extended: ' + extended); // console.log('shared: ' + shared); // console.log('toread: ' + toread); // console.log('tags: ' + tags); // console.log('url: ' + url); // console.log('value: ' + value);
                    tag = document.createElement('div');
                    // if (recent_in_horizontal_menu) { tag.setAttribute('class', 'pure-menu-link'); }
                    tag.textContent = value;
                  }

                  li.appendChild(tag)
                  list.appendChild(li);
                  dlisst.push(value);
                }
              }
            });
            last_tags = dlisst;
          }
          else
            last_tags = [];
          resolve({
            description: description,
            hash: "",
            time: time,
            extended: extended,
            site_tags: tags,
            shared: shared,
            toread: toread,
            url: url,
            tags: last_tags,
            tags_html: document.createElement('ul') /// list
          });
        }
      };
      xhr.send();
    });
  }

  analyze_page0 = async (url) => {
    if (noisy) { console.log("analyze_page() url: " + url); }
    return new Promise((resolve, reject) => {
      resolve({});
    });
  }

  analyze_page = async (url) => {
    if (noisy) { console.log("analyze_page() url: " + url); }
    const self = this;
    return new Promise((resolve, reject) => {
      // resolve({});

      if (!this.hasAuth()) {
if (noisy) { console.log("pb.js ap 209"); }
        reject('not logged in');
      }
      else {
        // resolve({});

if (noisy) { console.log("pb.js ap 215"); }
        var pinurl = this.getPostsUrl();
        if (noisy) { console.log("analyze_page() pinurl: " + pinurl); }
// resolve({});
        var xhr = new XMLHttpRequest(); 
        xhr.open('GET', pinurl, true);
        xhr.onreadystatechange = analyze_page_cb.bind(self, url, xhr, resolve, reject);
        xhr.send();
       }
    });
  }
};

// function analyze_page_cb(url, xhr, resolve, reject, event) {
//   resolve({});
// };

function analyze_page_cb(url, xhr, resolve, reject, event) {
  if (noisy) {
    console.log("analyze_page_cb()");
    console.dir(this);
    console.dir(url);
    console.dir(xhr);
    console.dir(resolve);
    console.dir(reject);
    console.dir(event);
  }
  // resolve({});

  if (noisy) { console.log('analyze_page() xhr.onreadystatechange()'); }
  if (noisy) { console.log(event); }
  if (noisy) { console.log(this); }
  if (event.target.readyState == 4 && event.target.status == 401) {
    if (noisy) { console.log("pb.js ap 216"); }
    reject(event.target.status);
  } else if (event.target.readyState == 4 && event.target.status == 200) {
    if (noisy) { console.log("pb.js ap 219"); }
    // resolve({});

    if (noisy) { console.log(xhr.responseURL); }
    var data = xhr.responseXML;
    if (noisy) { console.log(data); }
    if (!data) {
      if (noisy) { console.log("pb.js ap 224"); }
      // resolve({});

      if (noisy) { console.log('null data, xhr:'); }
      if (noisy) { console.dir(xhr); }
      let post = {
        description: '',
        hash: '',
        time: '',
        // title: title,
        extended: '',
        tag: '',
        tags: [],
        shared: true,
        toread: false,
        url: url
      }
      if (noisy) { console.dir(post); }

      self.storePost(post);
      resolve(post);
    } else {
      if (noisy) { console.log("pb.js ap 244"); }
      // resolve({});

      var resPost = data.getElementsByTagName("post");
      if (noisy) { console.log("resPost tags: " + $(resPost).attr("tag")); }

      if (noisy) { console.dir(resPost); }

      let description = $(resPost).attr("description");
      let hash = $(resPost).attr("hash");
      let time = $(resPost).attr("time");
      let extended = $(resPost).attr("extended");
      let tag = $(resPost).attr('tag');
      let tags = tag ? tag.split(' ') : [];
      let shared = $(resPost).attr("shared");
      let toread = $(resPost).attr("toread");
      if (typeof description === 'undefined') {
        description = '';
        // description = document.title || '';
      }
      if (typeof extended === 'undefined') {
        extended = '';
      }
      if (noisy) { console.dir(tags); }

      let post = {
        description: description,
        hash: hash,
        time: time,
        // title: title,
        extended: extended,
        tag: tag,
        tags: tags,
        shared: shared,
        toread: toread,
        url: url
      }
      if (noisy) { console.dir(post); }

      this.storePost(post);
      resolve(post);
    }
  }
}

function occurrence(array) {
    "use strict";
    var result = {};
    if (array instanceof Array) {
        array.forEach(function (v, i) {
            if (!result[v]) {
                result[v] = [i];
            } else {
                result[v].push(i);
            }
        });
        Object.keys(result).forEach(function (v) {
            result[v] = {"index": result[v], "length": result[v].length};
        });
    }
    return result;
};

function posts_get_tags(posts) {
  if (noisy) { console.log('posts_get_tags()'); }
  var tags = [];
  if (posts.length > 0) {
    // var txt = ""; //posts.length.toString();
    for (var i = 0; i < posts.length; i++) {
      var post = posts[i];
      var suggested = post.getAttribute('tag');
      if (suggested != '') {
        // txt = txt + ' ' + suggested;
        // var tag_list = suggested.split(' ');
        suggested.split(' ').forEach((value, index) => {
          tags.push(value);
        });
      }
    }
  }
  if (noisy) { console.log('tags'); }
  if (noisy) { console.dir(tags); }
  oc = occurrence(tags);
  if (noisy) { console.log('oc'); }
  if (noisy) { console.dir(oc); }
  ok1 = Object.keys(oc).map(k => [k, oc[k].length]);
  if (noisy) { console.log('ok1'); }
  if (noisy) { console.dir(ok1); }
  ok2 = ok1.sort((a, b) => b[1] - a[1]);
  if (noisy) { console.log('ok2'); }
  if (noisy) { console.dir(ok2); }
  ok = ok2.map(x => x[0]);
  if (noisy) { console.log('ok'); }
  if (noisy) { console.dir(ok); }
  return ok;
}

async function read_current_tags(url) {
  if (noisy) { console.log("src/bg/pinboard.js read_current_tags()"); }
  return new Promise(async (resolve, reject) => {
    if (noisy) { console.log("src/bg/pinboard.js read_current_tags promise"); }
    try {
      let url_neat = url.replace(/#.#$/, '');
      let pb = new Pb(url_neat);
      pb.analyze_page(url_neat).then(data => {
        resolve(pb.getPost());
      })
      .catch(error => {
        // console.error('Error during service worker:', error);
        reject(error);
      });
    } catch(e) {
      if (noisy) { console.log("src/bg/pinboard.js read_current_tags promise catch"); }
      reject(e);
    }
  });
}

async function read_recent_tags(description, time, extended, shared, tags, toread, url) {
  if (noisy) { console.log("src/bg/pinboard.js read_recent_tags()"); }
  return new Promise(async (resolve, reject) => {
    if (noisy) { console.log("src/bg/pinboard.js read_recent_tags promise"); }
    try {
      let url_neat = url.replace(/#.#$/, '');
      let pb = new Pb(url_neat);
      pb.read_recent(description, time, extended, shared, tags, toread, url_neat).then(data => {
        if (noisy) { console.log('src/bg/pinboard.js read_recent_tags\ndata:'); }
        if (noisy) { console.dir(data); }
        resolve(data);
        // console.log("src/bg/pinboard.js pb.getUrl");
        // console.log(pb.getUrl());

        // console.log("src/bg/pinboard.js pb.getPost");
        // let pp = pb.getPost();
        // console.log("src/bg/pinboard.js pp");
        // console.dir(pp);
        // resolve(pp);
      });
    } catch(e) {
      if (noisy) { console.log("src/bg/pinboard.js read_recent_tags promise catch"); }
      reject(e);
    }
  });
}

if (log_version_on_extn_install) {
  let manifestData = chrome.runtime.getManifest();
  // console.log(manifestData.name + ' version: ' + manifestData.version);
  // console.log(manifestData.default_locale);
}

// if (false) {			// on extension install
//   setTimeout(
//     () => {
//       read_current_tags().then(data => {
//         console.log('src/bg/pinboard.js on load\ndata:');
//         console.dir(data);
//       });
//     },
//     1000
//   );
// }
