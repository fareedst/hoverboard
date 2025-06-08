class ThrottledRecentTags {
  constructor() {
    if (noisy) { console.log('ThrottledRecentTags constructor()'); }
    let settings = new Store('settings');
    this.recentTagTimestamp = settings.get('recentTagsTimestamp');
    if (noisy) { console.log('this.recentTagTimestamp:' + this.recentTagTimestamp); }
    this.tags = settings.get('recentTags');
    if (noisy) { console.log('this.tags:' + this.tags); }
  }

  appendTag(tag) {
    let settings = new Store('settings');
    this.timestamp = settings.get('recentTagsTimestamp');
    this.tags = settings.get('recentTags');

    // prepend new tag, remove duplicates
    this.tags = (tag.split(' ')).concat(this.tags.filter(t => t !== tag));

    this.timestamp = Date.now();
    if (noisy) { console.log('ThrottledRecentTags.appendTag this.timestamp: ' + this.timestamp); }
    if (noisy) { console.log('ThrottledRecentTags.appendTag this.tags: ' + this.tags); }
    settings.set('recentTagsTimestamp', this.timestamp);
    settings.set('recentTags', this.tags);
  }

  get delaySeconds() {
    return 60;
  }

  async readTags(description, time, extended, shared, excludeTags, toread, url) {
    if (noisy) { console.log('ThrottledRecentTags readTags()'); }
    return new Promise((resolve, reject) => {
      try {
        let now = Date.now();
        if (noisy) { console.log('ThrottledRecentTags.readTags now: ' + now); }

        let settings = new Store('settings');
        this.timestamp = settings.get('recentTagsTimestamp');
        if (noisy) { console.log('ThrottledRecentTags.readTags this.timestamp: ' + this.timestamp); }
        this.tags = settings.get('recentTags');
        if (noisy) { console.log('ThrottledRecentTags.readTags this.tags: ' + this.tags); }

        if ((typeof this.timestamp !== 'undefined') && (this.timestamp !== null)) {
          let diff = (now - this.timestamp) / 1000;
          if (noisy) { console.log('ThrottledRecentTags.readTags diff: ' + diff); }
        }

        if ((typeof this.timestamp === 'undefined')
            || (this.timestamp === null) 
            || (((now - this.timestamp) / 1000) > this.delaySeconds)) {
          if (logThrottledGetFresh) { console.log('ThrottledRecentTags readTags get new'); }        
          this.timestamp = now;
          // this.tags = [1];
          let pb = new Pb(url);
          pb.readFreshRecentTags(excludeTags).then(data => {
            if (noisy) { log('ThrottledRecentTags', 'readTags', 'readFreshRecentTags', 'data:', data) }
            this.tags = data;
            settings.set('recentTagsTimestamp', this.timestamp);
            settings.set('recentTags', this.tags);
            if (noisy) { console.log('ThrottledRecentTags return tags: ' + this.tags); }
            resolve({
              description: description,
              hash: "",
              time: time,
              excludeTags: excludeTags,
              extended: extended,
              shared: shared,
              siteTags: excludeTags,
              toread: toread,
              url: url,
              tags: this.tags
              // tagsHtml: document.createElement('ul') /// list
            });
          })
          .catch(error => {
            log('ThrottledRecentTags', 'readTags', 'error:', error)
            reject(error)
          });
        } else {
          if (logThrottledGetCache) {
            console.log('ThrottledRecentTags readTags return existing');
            console.log('ThrottledRecentTags return tags: ' + this.tags);
          }
          resolve({
            description: description,
            time: time,
            hash: '',
            excludeTags: excludeTags,
            extended: extended,
            shared: shared,
            siteTags: excludeTags,
            tags: this.tags,
            toread: toread,
            url: url
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}
