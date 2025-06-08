if (noisy) { console.log('hi', 'BOF'); }

// features
//
const showContentTagsInHover = dtrue;

class HoverInjector {
  constructor(doct) {
    if (noisyPlace) { log('HoverInjector'); }
    this.doct = doct;

    const overlayContainerIsDivNotTable = true;

    this.loadSite = (pageLoad, response, show) => {
      if (noisyPlace) { log('HoverInjector', 'loadSite') }
      if (response.url) {
        let tags = response.tags;
        if (noisy) { log('HoverInjector', 'loadSite', 'tags:', tags) }
        if (logTitleOnPinLoad) { console.log('logTitleOnPinLoad: ' + response.description); }
        if (tags) {
          allit = newPin(response, {
            action: msgBackReadRecent,
            siteTags: Object.assign([], response.tags),
            tags: Object.assign([], response.tags)
          });
          if (noisy) { log('HoverInjector', 'loadSite', 'allit:', allit) }

          show = show && !(showHoverOPLOnlyIfNoTags && pageLoad && (tags.length > 0));
          show = show && !(showHoverOPLOnlyIfSomeTags && pageLoad && (tags.length === 0));
          if (noisyShowLogic) { log('HoverInjector', 'loadSite', 'show:', show) }
          if (show) {
            this.placeOverlayInDocument(makeSiteTagsRowElement(allit, tags));
            this.placeRecentAndContentTagsInOverlay(response, tags);
          }
        }
      } else {
        this.overlayShowSpan("Credentials missing!");
      }
    };

    this.placeOverlayInDocument = (list) => {
      if (noisyPlace) { log('HoverInjector', 'placeOverlayInDocument', 'list:', list) }
      var ov = gjq(this.doct).find("#overlay");
      var container;
      if (ov.length === 1) {
        // overlay already in document
        container = ov[0];
      } else {
        // append container as last child of body
        container = this.doct.createElement(overlayContainerIsDivNotTable ? 'div': 'table');
        container.setAttribute('id', 'overlay');
        if (noisyPlace) { console.dir(gjq('body')); }
        gjq('body')[0].appendChild(container);

        // // hide panel
        // // gjq("#overlay").click(function(){
        // gjq(container).click(() => {
        //   // gjq("#overlay").css('display', 'none');
        //   gjq("#overlay").remove();
        // });
      }
      if (noisyPlace) { console.dir(container); }

      // insert content as div or table
      //
      let target;
      let wrap;
      if (overlayContainerIsDivNotTable) {
        target = wrap = this.doct.createElement('div');
      } else {
        wrap = this.doct.createElement('tr');
        wrap.appendChild(target = this.doct.createElement('td'));
      }
      container.appendChild(wrap);    
      target.appendChild(list);
      if (noisyPlace) { console.log('<- HoverInjector#placeOverlayInDocument()'); }
    };

    this.placeRecentAndContentTagsInOverlay = (response, tags) => {
      if (noisyPlace) { log('HoverInjector', 'placeRecentAndContentTagsInOverlay') }
      if (hoverShowRecentTags) {
        BRSendMessage(
          allit,
          response => {
            if (noisy) { log('HoverInjector', 'placeRecentAndContentTagsInOverlay', 'crsm', 'response:', response) }
            if (response) {
              this.placeTagsInOverlayInDocument('Recent:', 'Recent Tags (click to tag)', response, tags);
              if (showContentTagsInHover) {
                this.displayHeadingTags(allit);
              }
            }
          }
        );
      }
      else {
        if (showContentTagsInHover) {
          this.displayHeadingTags(allit);
        }
      }
    };

    this.overlayShowSpan = (text) => {
      if (noisyPlace) { log('HoverInjector', 'overlayShowSpan') }
      let cell = this.doct.createElement('span');
      cell.textContent = text;
      this.placeOverlayInDocument(cell);
    };

    this.addTagsToContainer = (response, container, knownList) => {
      if (noisyPlace) { log('HoverInjector', 'addTagsToContainer', 'response:', response, 'knownList:', knownList) }
      var tags = response.tags;
      if (typeof tags == 'string') return;

      var added = 0;
      // var dlisst = [];  
      tags.forEach((value, index) => {
        if (noisy) {
          log('HoverInjector', 'addTagsToContainer', 'tag index:', index, 'value:', value, 'recentTagsCountMax:' , recentTagsCountMax);
        }
        if (added < recentTagsCountMax) {

          // var knownList = []; ///tags ? tags.split(' ') : [];
          // var currTags, url;

          const matched = (knownList.indexOf(value) >= 0);
          if (matched) {
            if (noisy) console.log('is matched');
          } else {
            if (noisy) console.log('is new');
            added++;
            var cell;
            if (recentAsList) {
              cell = this.doct.createElement('span');
              cell.setAttribute('class', 'tiny');
            }
            else {
              cell = this.doct.createElement(recentAsTable ? 'td' : 'li');
            }
            container.appendChild(cell);

            if (recentInHorizontalMenu) { cell.setAttribute('class', 'pure-menu-item'); }

            var tag;
            if (true) {
              tag = makeRecentAnchor(
                gjq,
                newPin(response, { tags: knownList }),
                value,
                makeRecentAnchor2
              );
            }
            else {
              if (noisy) console.log('make_tagText()');
              // console.log('description: ' + description); // console.log('time: ' + time); // console.log('extended: ' + extended); // console.log('shared: ' + shared); // console.log('toread: ' + toread); // console.log('tags: ' + tags); // console.log('url: ' + url); // console.log('value: ' + value);
              tag = this.doct.createElement('div');
              // if (recentInHorizontalMenu) { tag.setAttribute('class', 'pure-menu-link'); }
              tag.textContent = value;
            }
            if (noisy) { log('tag:', tag, 'cell:', cell) }

            cell.appendChild(tag)
            // dlisst.push(value);
          }
        }
      });
    };

    this.placeTagsInOverlayInDocument = (name, tooltip, response, knownList) => {
      var tags = response.tags;
      if (noisy) { log('HoverInjector', 'placeTagsInOverlayInDocument', 'tags:', tags) }

      if (tags && tags.length > 0) {
        var container;
        var major;
        if (recentAsList) {
          container = this.doct.createElement('div');
          container.setAttribute('class', 'scrollmenu');
          major = container;

          var title = this.doct.createElement('span');
          title.setAttribute('class', 'tiny');
          title.textContent = name;
          if (injectOptions.hoverShowTooltips) { addTooltip(title, tooltip, WIDEN); }
          container.appendChild(title);
        } else if (recentAsTable) {
          var table = this.doct.createElement('table');
          table.setAttribute('class', 'pure-table pure-table-horizontal');
          var tbody = this.doct.createElement('tbody');
          tbody.setAttribute('class', '');
          var tr1 = this.doct.createElement('tr');
          tr1.setAttribute('class', 'pure-table-odd');
          tbody.appendChild(tr1);
          table.appendChild(tbody);

          var td = this.doct.createElement('td');
          gjq(td).attr('class', 'rowHeading');
          td.textContent = name;
          tr1.appendChild(td);

          container = tr1;
          major = table;
        } else {
          container = this.doct.createElement('ul');
          major = container;
        }
        container.setAttribute('id', 'recentList');
        if (recentInHorizontalMenu) { container.setAttribute('class', 'pure-menu-list'); }
        // var knownList = [];
        this.addTagsToContainer(response, container, knownList);
        this.placeOverlayInDocument(major);
      }
    };

    this.displayHeadingTags = (pin) => {
      if (noisy) { log('pin:', pin) }
      var tagstr = gjq('h1,h2,h3,h4').map(() => {
        return gjq(this).text();
      }).get();
      tagstr += ' ' + this.doct.title;
      if (noisy) console.log('tagstr:' + tagstr);

      var tags = tagstr.replace(',', ' ').split(/([^\w]+)/).filter( e => e.length > 1);
      if (noisy) { log('tags', tags) }
      tags = tags.flatMap(s => (s === s.toLowerCase() ? [s] : [s, s.toLowerCase()]));
      if (noisy) { log('tags', tags) }
      // oc = occurrence(tags);
      // if (noisy) { log('oc', oc) }
      // ok1 = Object.keys(oc).map(k => [k, oc[k].length]);
      // if (noisy) { log('ok1', ok1) }
      // ok2 = ok1.sort((a, b) => b[1] - a[1]);
      // if (noisy) { log('ok2', ok2) }
      // ok = ok2.map(x => x[0]);
      // if (noisy) { log('ok', ok) }

      let response = newPin(pin, {
        action: "readHeadingTags",
        siteTags: Object.assign([], pin.siteTags),
        tags: sortArrayByFrequency(tags)
      });
      if (noisy) { log(' !! fghi  readHeadingTags', 'response:', response) }

      this.placeTagsInOverlayInDocument('Headings:', 'Words in Headings (click to tag)', response, pin.tags);
    };
  }
}

if (noisy) { console.log('hi', 'EOF'); }
