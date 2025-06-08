this.manifest = {
  name: 'Hoverboard',
  icon: '../../icons/hoverboard_48.png',
  settings: [
    // {
    //     "tab": i18n.get("information"),
    //     "group": i18n.get("login"),
    //     "name": "username",
    //     "type": "text",
    //     "label": i18n.get("username"),
    //     "text": i18n.get("x-characters")
    // },
    // {
    //     "tab": i18n.get("information"),
    //     "group": i18n.get("login"),
    //     "name": "password",
    //     "type": "text",
    //     "label": i18n.get("password"),
    //     "text": i18n.get("x-characters-pw"),
    //     "masked": true
    // },
    {
      tab: i18n.get('information'),
      group: i18n.get('login'),
      name: 'token',
      type: 'text',
      label: i18n.get('tokenLabel'),
      text: i18n.get('x-characters-token'),
      masked: true
    },
    {
      tab: i18n.get('information'),
      group: i18n.get('login'),
      name: 'myDescription',
      type: 'description',
      text: i18n.get('description')
    },

    // {
    //     "tab": i18n.get("information"),
    //     "group": i18n.get("logout"),
    //     "name": "myCheckbox",
    //     "type": "checkbox",
    //     "label": i18n.get("enable")
    // },
    // {
    //     "tab": i18n.get("information"),
    //     "group": i18n.get("logout"),
    //     "name": "myButton",
    //     "type": "button",
    //     "label": i18n.get("disconnect"),
    //     "text": i18n.get("logout")
    // },
    {
      tab: i18n.get('information'),
      group: i18n.get('Controls'),
      name: 'inhibit',
      type: 'textarea',
      label: i18n.get('inhibitLabel'),
      text: i18n.get('inhibitPlaceholder'),
      masked: true
    },
    {
      tab: i18n.get('information'),
      group: i18n.get('Controls'),
      name: 'inhibitDescription',
      type: 'description',
      text: i18n.get('inhibitDescription')
    },
    // {
    //     "tab": "Details",
    //     "group": "Sound",
    //     "name": "notiVolume",
    //     "type": "slider",
    //     "label": "Notification volume:",
    //     "max": 1,
    //     "min": 0,
    //     "step": 0.01,
    //     "display": true,
    //     "displayModifier": function (value) {
    //         return (value * 100).floor() + "%";
    //     }
    // },
    // {
    //     "tab": "Details",
    //     "group": "Sound",
    //     "name": "soundVolume",
    //     "type": "slider",
    //     "label": "Sound volume:",
    //     "max": 100,
    //     "min": 0,
    //     "step": 1,
    //     "display": true,
    //     "displayModifier": function (value) {
    //         return value + "%";
    //     }
    // },
    // {
    //     "tab": "Details",
    //     "group": "Food",
    //     "name": "myPopupButton",
    //     "type": "popupButton",
    //     "label": "Soup 1 should be:",
    //     "options": {
    //         "groups": [
    //             "Hot", "Cold",
    //         ],
    //         "values": [
    //             {
    //                 "value": "hot",
    //                 "text": "Very hot",
    //                 "group": "Hot",
    //             },
    //             {
    //                 "value": "Medium",
    //                 "group": 1,
    //             },
    //             {
    //                 "value": "Cold",
    //                 "group": 2,
    //             },
    //             ["Non-existing"]
    //         ],
    //     },
    // },
    // {
    //     "tab": "Details",
    //     "group": "Food",
    //     "name": "myListBox",
    //     "type": "listBox",
    //     "label": "Soup 2 should be:",
    //     "options": [
    //         ["hot", "Hot and yummy"],
    //         ["cold"]
    //     ]
    // },
    // {
    //     "tab": "Details",
    //     "group": "Food",
    //     "name": "myRadioButtons",
    //     "type": "radioButtons",
    //     "label": "Soup 3 should be:",
    //     "options": [
    //         ["hot", "Hot and yummy"],
    //         ["cold"]
    //     ]
    // },

    // options
    //
    {
      tab: i18n.get('settings'),
      group: i18n.get('optionsGroupName'),
      name: 'recentPostsCount',
      type: 'slider',
      label: i18n.get('recentPostsCount'),
      max: 64,
      min: 1,
      step: 1
    },
    {
      tab: i18n.get('settings'),
      group: i18n.get('optionsGroupName'),
      name: 'showHoverOnPageLoad',
      type: 'checkbox',
      label: i18n.get('showHoverboardOnPage_loadLabel')
    },
    {
      tab: i18n.get('settings'),
      group: i18n.get('optionsGroupName'),
      name: 'hoverShowTooltips',
      type: 'checkbox',
      label: i18n.get('showTooltipsLabel')
    },
    {
      tab: i18n.get('settings'),
      group: i18n.get('optionsGroupName'),
      name: 'badgeTextIfBookmarkedNoTags',
      type: 'text',
      label: i18n.get('badgeTextIfBookmarkedNoTags')
    },
    {
      tab: i18n.get('settings'),
      group: i18n.get('optionsGroupName'),
      name: 'badgeTextIfNotBookmarked',
      type: 'text',
      label: i18n.get('badgeTextIfNotBookmarked')
    },

    // credits
    //
    {
      tab: i18n.get('creditsTabName'),
      group: i18n.get('creditsGroupName'),
      name: 'creditsTab',
      type: 'description',
      text: i18n.get('credits')
    }
  ],
  alignment: [
    [
      // "username",
      // "password",
      'token'
      // ],
      // [
      //     "notiVolume",
      //     "soundVolume"
    ]
  ]
}
