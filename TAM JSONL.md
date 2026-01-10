=== TELEMETRY SUMMARY ===

Nasıl yorumlanır?
- SCREEN_VIEW akışından hangi ekranda kaldı anlaşılır
- MAP_MOUNT var ama MAP_READY yoksa harita init sorunu
- STOP_SEARCH_RESULTS count=0 ise arama sonuç vermedi
- ALARM_SESSION_START var ama TRACKING_START yoksa tracking başlamadı
- TRIGGER_DECISION + ALARM_TRIGGERED akışı alarm tetiklenmesini gösterir

App Version: 1.1.0 (1)
Device: samsung SM-S721B
Platform: android 16

=== PERMISSIONS ===
Notifications: GRANTED
Location FG: granted
Location BG: granted

=== MAPS KEYS ===
Android Key: YES
iOS Key: YES
Web Key: YES

App Session ID: db1b8faa-32d5-4f88-b204-1e15f61cda97
Total Events: 63

=== LAST 50 EVENTS ===
[2026-01-10T13:10:01.719Z] INFO  STOP_SEARCH_RESULTS [StopSearch] (actionId: 21)
  Data: {
  "count": 25,
  "source": "network",
  "durationMs": 14
}
[2026-01-10T13:10:01.786Z] INFO  STOP_SEARCH_INPUT [StopSearch] (actionId: 22)
  Data: {
  "queryLen": 6
}
[2026-01-10T13:10:08.335Z] INFO  APP_LAUNCH (actionId: 1)
  Data: {
  "appVersion": "1.1.0",
  "buildNumber": "1"
}
[2026-01-10T13:10:08.335Z] INFO  APP_READY (actionId: 2)
[2026-01-10T13:10:08.336Z] INFO  APP_FOREGROUND (actionId: 3)
[2026-01-10T13:10:08.767Z] INFO  AUTH_STATE (actionId: 4)
  Data: {
  "state": "SIGNED_IN"
}
[2026-01-10T13:10:08.777Z] INFO  SCREEN_VIEW [HomeLanding] (actionId: 5)
  Data: {
  "route": "HomeLanding"
}
[2026-01-10T13:10:09.858Z] INFO  STOP_SEARCH_OPEN [HomeLanding] (actionId: 6)
  Data: {
  "initialTab": "stops"
}
[2026-01-10T13:10:09.859Z] INFO  SCREEN_VIEW [StopSearch] (actionId: 7)
  Data: {
  "route": "StopSearch"
}
[2026-01-10T13:10:11.909Z] INFO  STOP_SEARCH_SUBMIT [StopSearch] (actionId: 8)
  Data: {
  "queryLen": 2
}
[2026-01-10T13:10:11.941Z] INFO  STOP_SEARCH_RESULTS [StopSearch] (actionId: 9)
  Data: {
  "count": 25,
  "source": "network",
  "durationMs": 20
}
[2026-01-10T13:10:12.938Z] INFO  STOP_SEARCH_SUBMIT [StopSearch] (actionId: 10)
  Data: {
  "queryLen": 6
}
[2026-01-10T13:10:12.964Z] INFO  STOP_SEARCH_RESULTS [StopSearch] (actionId: 11)
  Data: {
  "count": 25,
  "source": "network",
  "durationMs": 14
}
[2026-01-10T13:10:13.033Z] INFO  STOP_SEARCH_INPUT [StopSearch] (actionId: 12)
  Data: {
  "queryLen": 6
}
[2026-01-10T13:10:16.337Z] INFO  APP_LAUNCH (actionId: 1)
  Data: {
  "appVersion": "1.1.0",
  "buildNumber": "1"
}
[2026-01-10T13:10:16.337Z] INFO  APP_READY (actionId: 2)
[2026-01-10T13:10:16.339Z] INFO  APP_FOREGROUND (actionId: 3)
[2026-01-10T13:10:16.730Z] INFO  AUTH_STATE (actionId: 4)
  Data: {
  "state": "SIGNED_IN"
}
[2026-01-10T13:10:16.740Z] INFO  SCREEN_VIEW [HomeLanding] (actionId: 5)
  Data: {
  "route": "HomeLanding"
}
[2026-01-10T13:10:17.602Z] INFO  STOP_SEARCH_OPEN [HomeLanding] (actionId: 6)
  Data: {
  "initialTab": "stops"
}
[2026-01-10T13:10:17.603Z] INFO  SCREEN_VIEW [StopSearch] (actionId: 7)
  Data: {
  "route": "StopSearch"
}
[2026-01-10T13:10:19.260Z] INFO  LINE_SEARCH_RESULTS [StopSearch] (actionId: 8)
  Data: {
  "count": 800,
  "source": "network",
  "durationMs": 862
}
[2026-01-10T13:10:29.058Z] INFO  APP_LAUNCH (actionId: 1)
  Data: {
  "appVersion": "1.1.0",
  "buildNumber": "1"
}
[2026-01-10T13:10:29.058Z] INFO  APP_READY (actionId: 2)
[2026-01-10T13:10:29.059Z] INFO  APP_FOREGROUND (actionId: 3)
[2026-01-10T13:10:29.489Z] INFO  AUTH_STATE (actionId: 4)
  Data: {
  "state": "SIGNED_IN"
}
[2026-01-10T13:10:29.496Z] INFO  SCREEN_VIEW [HomeLanding] (actionId: 5)
  Data: {
  "route": "HomeLanding"
}
[2026-01-10T13:10:31.673Z] INFO  SCREEN_VIEW [StopsHome] (actionId: 6)
  Data: {
  "route": "StopsHome"
}
[2026-01-10T13:10:31.684Z] INFO  SCREEN_VIEW [StopsHome] (actionId: 7)
  Data: {
  "route": "StopsHome"
}
[2026-01-10T13:10:34.406Z] INFO  SCREEN_VIEW [HomeLanding] (actionId: 8)
  Data: {
  "route": "HomeLanding"
}
[2026-01-10T13:10:37.266Z] INFO  ALARM_SESSION_START [HomeLanding] (actionId: 9)
  Data: {
  "stopIdHashHash": "b6f86459",
  "radiusMeters": 400,
  "startedInside": false
}
[2026-01-10T13:10:37.437Z] INFO  DISTANCE_UPDATE [HomeLanding] (actionId: 10)
  Data: {
  "distanceMetersRounded": 11380,
  "radiusMeters": 400,
  "accuracyBucket": "mid"
}
[2026-01-10T13:10:37.495Z] INFO  TRACKING_START [HomeLanding] (actionId: 11)
  Data: {
  "success": true
}
[2026-01-10T13:10:37.513Z] INFO  SCREEN_VIEW [ActiveAlarm] (actionId: 12)
  Data: {
  "route": "ActiveAlarm"
}
[2026-01-10T13:10:42.523Z] INFO  SCREEN_VIEW [HomeLanding] (actionId: 13)
  Data: {
  "route": "HomeLanding"
}
[2026-01-10T13:10:43.980Z] INFO  SCREEN_VIEW [ActiveAlarm] (actionId: 14)
  Data: {
  "route": "ActiveAlarm"
}
[2026-01-10T13:10:51.702Z] INFO  APP_LAUNCH (actionId: 1)
  Data: {
  "appVersion": "1.1.0",
  "buildNumber": "1"
}
[2026-01-10T13:10:51.702Z] INFO  APP_READY (actionId: 2)
[2026-01-10T13:10:51.703Z] INFO  APP_FOREGROUND (actionId: 3)
[2026-01-10T13:10:52.172Z] INFO  AUTH_STATE (actionId: 4)
  Data: {
  "state": "SIGNED_IN"
}
[2026-01-10T13:10:52.179Z] INFO  SCREEN_VIEW [HomeLanding] (actionId: 5)
  Data: {
  "route": "HomeLanding"
}
[2026-01-10T13:10:58.111Z] INFO  APP_LAUNCH (actionId: 1)
  Data: {
  "appVersion": "1.1.0",
  "buildNumber": "1"
}
[2026-01-10T13:10:58.111Z] INFO  APP_READY (actionId: 2)
[2026-01-10T13:10:58.112Z] INFO  APP_FOREGROUND (actionId: 3)
[2026-01-10T13:10:58.504Z] INFO  AUTH_STATE (actionId: 4)
  Data: {
  "state": "SIGNED_IN"
}
[2026-01-10T13:10:58.513Z] INFO  SCREEN_VIEW [HomeLanding] (actionId: 5)
  Data: {
  "route": "HomeLanding"
}
[2026-01-10T13:11:01.410Z] INFO  SCREEN_VIEW [StopsHome] (actionId: 6)
  Data: {
  "route": "StopsHome"
}
[2026-01-10T13:11:01.421Z] INFO  SCREEN_VIEW [StopsHome] (actionId: 7)
  Data: {
  "route": "StopsHome"
}
[2026-01-10T13:11:08.812Z] INFO  SCREEN_VIEW [SettingsHome] (actionId: 8)
  Data: {
  "route": "SettingsHome"
}
[2026-01-10T13:11:13.125Z] INFO  SCREEN_VIEW [Diagnostics] (actionId: 9)
  Data: {
  "route": "Diagnostics"
}

=== JSONL ===
{"t":1768050595799,"iso":"2026-01-10T13:09:55.799Z","level":"info","name":"SCREEN_VIEW","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"HomeLanding","actionId":8,"data":{"route":"HomeLanding"}}
{"t":1768050597148,"iso":"2026-01-10T13:09:57.148Z","level":"info","name":"STOP_SEARCH_OPEN","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"HomeLanding","actionId":9,"data":{"initialTab":"stops"}}
{"t":1768050597149,"iso":"2026-01-10T13:09:57.149Z","level":"info","name":"SCREEN_VIEW","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"StopSearch","actionId":10,"data":{"route":"StopSearch"}}
{"t":1768050599495,"iso":"2026-01-10T13:09:59.495Z","level":"info","name":"STOP_SEARCH_SUBMIT","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"StopSearch","actionId":11,"data":{"queryLen":2}}
{"t":1768050599526,"iso":"2026-01-10T13:09:59.526Z","level":"info","name":"STOP_SEARCH_RESULTS","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"StopSearch","actionId":12,"data":{"count":25,"source":"network","durationMs":19}}
{"t":1768050599581,"iso":"2026-01-10T13:09:59.581Z","level":"info","name":"STOP_SEARCH_INPUT","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"StopSearch","actionId":13,"data":{"queryLen":2}}
{"t":1768050600059,"iso":"2026-01-10T13:10:00.059Z","level":"info","name":"STOP_SEARCH_SUBMIT","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"StopSearch","actionId":14,"data":{"queryLen":3}}
{"t":1768050600123,"iso":"2026-01-10T13:10:00.123Z","level":"info","name":"STOP_SEARCH_INPUT","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"StopSearch","actionId":15,"data":{"queryLen":3}}
{"t":1768050600553,"iso":"2026-01-10T13:10:00.553Z","level":"info","name":"STOP_SEARCH_RESULTS","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"StopSearch","actionId":16,"data":{"count":25,"source":"network","durationMs":472}}
{"t":1768050600630,"iso":"2026-01-10T13:10:00.630Z","level":"info","name":"STOP_SEARCH_SUBMIT","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"StopSearch","actionId":17,"data":{"queryLen":5}}
{"t":1768050600715,"iso":"2026-01-10T13:10:00.715Z","level":"info","name":"STOP_SEARCH_INPUT","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"StopSearch","actionId":18,"data":{"queryLen":5}}
{"t":1768050600892,"iso":"2026-01-10T13:10:00.892Z","level":"info","name":"STOP_SEARCH_RESULTS","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"StopSearch","actionId":19,"data":{"count":25,"source":"network","durationMs":237}}
{"t":1768050601695,"iso":"2026-01-10T13:10:01.695Z","level":"info","name":"STOP_SEARCH_SUBMIT","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"StopSearch","actionId":20,"data":{"queryLen":6}}
{"t":1768050601719,"iso":"2026-01-10T13:10:01.719Z","level":"info","name":"STOP_SEARCH_RESULTS","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"StopSearch","actionId":21,"data":{"count":25,"source":"network","durationMs":14}}
{"t":1768050601786,"iso":"2026-01-10T13:10:01.786Z","level":"info","name":"STOP_SEARCH_INPUT","sessionId":"24f98355-61b7-402c-a07a-ffe54b5cd9c0","screen":"StopSearch","actionId":22,"data":{"queryLen":6}}
{"t":1768050608335,"iso":"2026-01-10T13:10:08.335Z","level":"info","name":"APP_LAUNCH","sessionId":"b5ece489-094c-4701-89b3-4fa8f0a744c0","actionId":1,"data":{"appVersion":"1.1.0","buildNumber":"1"}}
{"t":1768050608335,"iso":"2026-01-10T13:10:08.335Z","level":"info","name":"APP_READY","sessionId":"b5ece489-094c-4701-89b3-4fa8f0a744c0","actionId":2}
{"t":1768050608336,"iso":"2026-01-10T13:10:08.336Z","level":"info","name":"APP_FOREGROUND","sessionId":"b5ece489-094c-4701-89b3-4fa8f0a744c0","actionId":3}
{"t":1768050608767,"iso":"2026-01-10T13:10:08.767Z","level":"info","name":"AUTH_STATE","sessionId":"b5ece489-094c-4701-89b3-4fa8f0a744c0","actionId":4,"data":{"state":"SIGNED_IN"}}
{"t":1768050608777,"iso":"2026-01-10T13:10:08.777Z","level":"info","name":"SCREEN_VIEW","sessionId":"b5ece489-094c-4701-89b3-4fa8f0a744c0","screen":"HomeLanding","actionId":5,"data":{"route":"HomeLanding"}}
{"t":1768050609858,"iso":"2026-01-10T13:10:09.858Z","level":"info","name":"STOP_SEARCH_OPEN","sessionId":"b5ece489-094c-4701-89b3-4fa8f0a744c0","screen":"HomeLanding","actionId":6,"data":{"initialTab":"stops"}}
{"t":1768050609859,"iso":"2026-01-10T13:10:09.859Z","level":"info","name":"SCREEN_VIEW","sessionId":"b5ece489-094c-4701-89b3-4fa8f0a744c0","screen":"StopSearch","actionId":7,"data":{"route":"StopSearch"}}
{"t":1768050611909,"iso":"2026-01-10T13:10:11.909Z","level":"info","name":"STOP_SEARCH_SUBMIT","sessionId":"b5ece489-094c-4701-89b3-4fa8f0a744c0","screen":"StopSearch","actionId":8,"data":{"queryLen":2}}
{"t":1768050611941,"iso":"2026-01-10T13:10:11.941Z","level":"info","name":"STOP_SEARCH_RESULTS","sessionId":"b5ece489-094c-4701-89b3-4fa8f0a744c0","screen":"StopSearch","actionId":9,"data":{"count":25,"source":"network","durationMs":20}}
{"t":1768050612938,"iso":"2026-01-10T13:10:12.938Z","level":"info","name":"STOP_SEARCH_SUBMIT","sessionId":"b5ece489-094c-4701-89b3-4fa8f0a744c0","screen":"StopSearch","actionId":10,"data":{"queryLen":6}}
{"t":1768050612964,"iso":"2026-01-10T13:10:12.964Z","level":"info","name":"STOP_SEARCH_RESULTS","sessionId":"b5ece489-094c-4701-89b3-4fa8f0a744c0","screen":"StopSearch","actionId":11,"data":{"count":25,"source":"network","durationMs":14}}
{"t":1768050613033,"iso":"2026-01-10T13:10:13.033Z","level":"info","name":"STOP_SEARCH_INPUT","sessionId":"b5ece489-094c-4701-89b3-4fa8f0a744c0","screen":"StopSearch","actionId":12,"data":{"queryLen":6}}
{"t":1768050616337,"iso":"2026-01-10T13:10:16.337Z","level":"info","name":"APP_LAUNCH","sessionId":"f96f4e0f-a3c8-4149-b908-f1295aaef4b4","actionId":1,"data":{"appVersion":"1.1.0","buildNumber":"1"}}
{"t":1768050616337,"iso":"2026-01-10T13:10:16.337Z","level":"info","name":"APP_READY","sessionId":"f96f4e0f-a3c8-4149-b908-f1295aaef4b4","actionId":2}
{"t":1768050616339,"iso":"2026-01-10T13:10:16.339Z","level":"info","name":"APP_FOREGROUND","sessionId":"f96f4e0f-a3c8-4149-b908-f1295aaef4b4","actionId":3}
{"t":1768050616730,"iso":"2026-01-10T13:10:16.730Z","level":"info","name":"AUTH_STATE","sessionId":"f96f4e0f-a3c8-4149-b908-f1295aaef4b4","actionId":4,"data":{"state":"SIGNED_IN"}}
{"t":1768050616740,"iso":"2026-01-10T13:10:16.740Z","level":"info","name":"SCREEN_VIEW","sessionId":"f96f4e0f-a3c8-4149-b908-f1295aaef4b4","screen":"HomeLanding","actionId":5,"data":{"route":"HomeLanding"}}
{"t":1768050617602,"iso":"2026-01-10T13:10:17.602Z","level":"info","name":"STOP_SEARCH_OPEN","sessionId":"f96f4e0f-a3c8-4149-b908-f1295aaef4b4","screen":"HomeLanding","actionId":6,"data":{"initialTab":"stops"}}
{"t":1768050617603,"iso":"2026-01-10T13:10:17.603Z","level":"info","name":"SCREEN_VIEW","sessionId":"f96f4e0f-a3c8-4149-b908-f1295aaef4b4","screen":"StopSearch","actionId":7,"data":{"route":"StopSearch"}}
{"t":1768050619260,"iso":"2026-01-10T13:10:19.260Z","level":"info","name":"LINE_SEARCH_RESULTS","sessionId":"f96f4e0f-a3c8-4149-b908-f1295aaef4b4","screen":"StopSearch","actionId":8,"data":{"count":800,"source":"network","durationMs":862}}
{"t":1768050629058,"iso":"2026-01-10T13:10:29.058Z","level":"info","name":"APP_LAUNCH","sessionId":"3111fcb3-6b61-4a12-b85a-ff383687b0fc","actionId":1,"data":{"appVersion":"1.1.0","buildNumber":"1"}}
{"t":1768050629058,"iso":"2026-01-10T13:10:29.058Z","level":"info","name":"APP_READY","sessionId":"3111fcb3-6b61-4a12-b85a-ff383687b0fc","actionId":2}
{"t":1768050629059,"iso":"2026-01-10T13:10:29.059Z","level":"info","name":"APP_FOREGROUND","sessionId":"3111fcb3-6b61-4a12-b85a-ff383687b0fc","actionId":3}
{"t":1768050629489,"iso":"2026-01-10T13:10:29.489Z","level":"info","name":"AUTH_STATE","sessionId":"3111fcb3-6b61-4a12-b85a-ff383687b0fc","actionId":4,"data":{"state":"SIGNED_IN"}}
{"t":1768050629496,"iso":"2026-01-10T13:10:29.496Z","level":"info","name":"SCREEN_VIEW","sessionId":"3111fcb3-6b61-4a12-b85a-ff383687b0fc","screen":"HomeLanding","actionId":5,"data":{"route":"HomeLanding"}}
{"t":1768050631673,"iso":"2026-01-10T13:10:31.673Z","level":"info","name":"SCREEN_VIEW","sessionId":"3111fcb3-6b61-4a12-b85a-ff383687b0fc","screen":"StopsHome","actionId":6,"data":{"route":"StopsHome"}}
{"t":1768050631684,"iso":"2026-01-10T13:10:31.684Z","level":"info","name":"SCREEN_VIEW","sessionId":"3111fcb3-6b61-4a12-b85a-ff383687b0fc","screen":"StopsHome","actionId":7,"data":{"route":"StopsHome"}}
{"t":1768050634406,"iso":"2026-01-10T13:10:34.406Z","level":"info","name":"SCREEN_VIEW","sessionId":"3111fcb3-6b61-4a12-b85a-ff383687b0fc","screen":"HomeLanding","actionId":8,"data":{"route":"HomeLanding"}}
{"t":1768050637266,"iso":"2026-01-10T13:10:37.266Z","level":"info","name":"ALARM_SESSION_START","sessionId":"3111fcb3-6b61-4a12-b85a-ff383687b0fc","alarmSessionId":"7X6URJiIxEaIi9kTC93q","screen":"HomeLanding","actionId":9,"data":{"stopIdHashHash":"b6f86459","radiusMeters":400,"startedInside":false}}
{"t":1768050637437,"iso":"2026-01-10T13:10:37.437Z","level":"info","name":"DISTANCE_UPDATE","sessionId":"3111fcb3-6b61-4a12-b85a-ff383687b0fc","alarmSessionId":"7X6URJiIxEaIi9kTC93q","screen":"HomeLanding","actionId":10,"data":{"distanceMetersRounded":11380,"radiusMeters":400,"accuracyBucket":"mid"}}
{"t":1768050637495,"iso":"2026-01-10T13:10:37.495Z","level":"info","name":"TRACKING_START","sessionId":"3111fcb3-6b61-4a12-b85a-ff383687b0fc","alarmSessionId":"7X6URJiIxEaIi9kTC93q","screen":"HomeLanding","actionId":11,"data":{"success":true}}
{"t":1768050637513,"iso":"2026-01-10T13:10:37.513Z","level":"info","name":"SCREEN_VIEW","sessionId":"3111fcb3-6b61-4a12-b85a-ff383687b0fc","alarmSessionId":"7X6URJiIxEaIi9kTC93q","screen":"ActiveAlarm","actionId":12,"data":{"route":"ActiveAlarm"}}
{"t":1768050642523,"iso":"2026-01-10T13:10:42.523Z","level":"info","name":"SCREEN_VIEW","sessionId":"3111fcb3-6b61-4a12-b85a-ff383687b0fc","alarmSessionId":"7X6URJiIxEaIi9kTC93q","screen":"HomeLanding","actionId":13,"data":{"route":"HomeLanding"}}
{"t":1768050643980,"iso":"2026-01-10T13:10:43.980Z","level":"info","name":"SCREEN_VIEW","sessionId":"3111fcb3-6b61-4a12-b85a-ff383687b0fc","alarmSessionId":"7X6URJiIxEaIi9kTC93q","screen":"ActiveAlarm","actionId":14,"data":{"route":"ActiveAlarm"}}
{"t":1768050651702,"iso":"2026-01-10T13:10:51.702Z","level":"info","name":"APP_LAUNCH","sessionId":"6b5b8bba-a4d6-419b-9038-909ea7546713","actionId":1,"data":{"appVersion":"1.1.0","buildNumber":"1"}}
{"t":1768050651702,"iso":"2026-01-10T13:10:51.702Z","level":"info","name":"APP_READY","sessionId":"6b5b8bba-a4d6-419b-9038-909ea7546713","actionId":2}
{"t":1768050651703,"iso":"2026-01-10T13:10:51.703Z","level":"info","name":"APP_FOREGROUND","sessionId":"6b5b8bba-a4d6-419b-9038-909ea7546713","actionId":3}
{"t":1768050652172,"iso":"2026-01-10T13:10:52.172Z","level":"info","name":"AUTH_STATE","sessionId":"6b5b8bba-a4d6-419b-9038-909ea7546713","actionId":4,"data":{"state":"SIGNED_IN"}}
{"t":1768050652179,"iso":"2026-01-10T13:10:52.179Z","level":"info","name":"SCREEN_VIEW","sessionId":"6b5b8bba-a4d6-419b-9038-909ea7546713","screen":"HomeLanding","actionId":5,"data":{"route":"HomeLanding"}}
{"t":1768050658111,"iso":"2026-01-10T13:10:58.111Z","level":"info","name":"APP_LAUNCH","sessionId":"db1b8faa-32d5-4f88-b204-1e15f61cda97","actionId":1,"data":{"appVersion":"1.1.0","buildNumber":"1"}}
{"t":1768050658111,"iso":"2026-01-10T13:10:58.111Z","level":"info","name":"APP_READY","sessionId":"db1b8faa-32d5-4f88-b204-1e15f61cda97","actionId":2}
{"t":1768050658112,"iso":"2026-01-10T13:10:58.112Z","level":"info","name":"APP_FOREGROUND","sessionId":"db1b8faa-32d5-4f88-b204-1e15f61cda97","actionId":3}
{"t":1768050658504,"iso":"2026-01-10T13:10:58.504Z","level":"info","name":"AUTH_STATE","sessionId":"db1b8faa-32d5-4f88-b204-1e15f61cda97","actionId":4,"data":{"state":"SIGNED_IN"}}
{"t":1768050658513,"iso":"2026-01-10T13:10:58.513Z","level":"info","name":"SCREEN_VIEW","sessionId":"db1b8faa-32d5-4f88-b204-1e15f61cda97","screen":"HomeLanding","actionId":5,"data":{"route":"HomeLanding"}}
{"t":1768050661410,"iso":"2026-01-10T13:11:01.410Z","level":"info","name":"SCREEN_VIEW","sessionId":"db1b8faa-32d5-4f88-b204-1e15f61cda97","screen":"StopsHome","actionId":6,"data":{"route":"StopsHome"}}
{"t":1768050661421,"iso":"2026-01-10T13:11:01.421Z","level":"info","name":"SCREEN_VIEW","sessionId":"db1b8faa-32d5-4f88-b204-1e15f61cda97","screen":"StopsHome","actionId":7,"data":{"route":"StopsHome"}}
{"t":1768050668812,"iso":"2026-01-10T13:11:08.812Z","level":"info","name":"SCREEN_VIEW","sessionId":"db1b8faa-32d5-4f88-b204-1e15f61cda97","screen":"SettingsHome","actionId":8,"data":{"route":"SettingsHome"}}
{"t":1768050673125,"iso":"2026-01-10T13:11:13.125Z","level":"info","name":"SCREEN_VIEW","sessionId":"db1b8faa-32d5-4f88-b204-1e15f61cda97","screen":"Diagnostics","actionId":9,"data":{"route":"Diagnostics"}}
=== END ===