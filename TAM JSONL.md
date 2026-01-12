=== TELEMETRY SUMMARY ===

Nasıl yorumlanır?
- SCREEN_VIEW akışından hangi ekranda kaldı anlaşılır
- MAP_MOUNT var ama MAP_READY yoksa harita init sorunu
- STOP_SEARCH_RESULTS count=0 ise arama sonuç vermedi
- ALARM_SESSION_START var ama TRACKING_START yoksa tracking başlamadı
- TRIGGER_DECISION + ALARM_TRIGGERED akışı alarm tetiklenmesini gösterir

App Version: 1.1.0 (2)
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

App Session ID: 996eaea1-ae29-4fcf-b723-6dd01968db9a
Included Sessions: 1/1
Only current session included
Total Events: 198 (of 198 total)

=== LAST 50 EVENTS ===
[2026-01-12T06:03:38.271Z] INFO  STOP_SEARCH_INPUT [StopSearch] (actionId: 158)
  Data: {
  "queryLen": 10
}
[2026-01-12T06:03:40.880Z] INFO  STOP_SEARCH_RESULTS [StopSearch] (actionId: 159)
  Data: {
  "count": 10,
  "source": "network",
  "durationMs": 2653,
  "cacheHit": false
}
[2026-01-12T06:03:45.160Z] INFO  STOP_PICK_FROM_LIST [StopSearch] (actionId: 160)
  Data: {
  "stopIdHash": "47770ebc"
}
[2026-01-12T06:03:45.174Z] INFO  MAP_MARKERS_RENDER [StopSearch] (actionId: 161)
  Data: {
  "count": 1
}
[2026-01-12T06:03:45.185Z] INFO  HOME_MAP_MOUNT_START [StopSearch] (actionId: 162)
  Data: {
  "hasRoute": true,
  "hasParams": true,
  "mode": "STOP_PREVIEW"
}
[2026-01-12T06:03:45.185Z] INFO  HOME_MAP_COMPONENT_MOUNTED [StopSearch] (actionId: 163)
  Data: {
  "hasUser": true,
  "hasActiveAlarm": false,
  "mode": "STOP_PREVIEW",
  "canUseMaps": true,
  "hasMapView": true,
  "hasRoute": true,
  "hasParams": true
}
[2026-01-12T06:03:45.185Z] INFO  MAP_MOUNT [StopSearch] (actionId: 164)
  Data: {
  "provider": "google",
  "hasAndroidKey": true,
  "hasIOSKey": true,
  "hasWebKey": true,
  "androidKeyLength": 0,
  "androidKeyPrefix": "EMPTY"
}
[2026-01-12T06:03:45.186Z] INFO  SCREEN_VIEW [HomeMap] (actionId: 165)
  Data: {
  "route": "HomeMap"
}
[2026-01-12T06:03:45.217Z] INFO  MAP_READY [HomeMap] (actionId: 166)
  Data: {
  "msFromMount": 32
}
[2026-01-12T06:03:49.733Z] INFO  SCREEN_VIEW [AlarmDetails] (actionId: 167)
  Data: {
  "route": "AlarmDetails"
}
[2026-01-12T06:03:50.192Z] WARN  MAP_ERROR [AlarmDetails] (actionId: 168)
  Data: {
  "reason": "blank_after_ready",
  "warning": "MAP_READY fired but map tiles may not be loading - check API key in AndroidManifest.xml"
}
[2026-01-12T06:03:52.178Z] INFO  MAP_REGION_CHANGE [AlarmDetails] (actionId: 169)
  Data: {
  "zoomApprox": 100,
  "moved": true
}
[2026-01-12T06:03:56.013Z] INFO  ALARM_SESSION_START [AlarmDetails] (actionId: 170)
  Data: {
  "stopIdHash": "47770ebc",
  "radiusMeters": 2000,
  "startedInside": false
}
[2026-01-12T06:03:56.164Z] INFO  TRACKING_START [AlarmDetails] (actionId: 171)
  Data: {
  "success": true
}
[2026-01-12T06:03:56.187Z] INFO  SCREEN_VIEW [ActiveAlarm] (actionId: 172)
  Data: {
  "route": "ActiveAlarm"
}
[2026-01-12T06:04:05.403Z] INFO  SCREEN_VIEW [HomeMap] (actionId: 173)
  Data: {
  "route": "HomeMap"
}
[2026-01-12T06:04:07.274Z] INFO  HOME_MAP_COMPONENT_UNMOUNT [HomeMap] (actionId: 174)
[2026-01-12T06:04:07.275Z] INFO  HOME_MAP_COMPONENT_UNMOUNT [HomeMap] (actionId: 175)
[2026-01-12T06:04:07.275Z] INFO  SCREEN_VIEW [HomeLanding] (actionId: 176)
  Data: {
  "route": "HomeLanding"
}
[2026-01-12T06:04:08.173Z] INFO  SCREEN_VIEW [ActiveAlarm] (actionId: 177)
  Data: {
  "route": "ActiveAlarm"
}
[2026-01-12T06:04:08.269Z] INFO  LOCATION_TASK_TICK [ActiveAlarm] (actionId: 178)
  Data: {
  "hasLocations": true,
  "count": 1,
  "accuracyBucket": "high"
}
[2026-01-12T06:04:08.280Z] INFO  DISTANCE_UPDATE [ActiveAlarm] (actionId: 179)
  Data: {
  "distanceMetersRounded": 5100,
  "radiusMeters": 2000,
  "accuracyBucket": "high"
}
[2026-01-12T06:04:09.253Z] INFO  MAP_REGION_CHANGE [ActiveAlarm] (actionId: 180)
  Data: {
  "zoomApprox": 84,
  "moved": true
}
[2026-01-12T06:04:13.293Z] INFO  DISTANCE_UPDATE [ActiveAlarm] (actionId: 181)
  Data: {
  "distanceMetersRounded": 5100,
  "radiusMeters": 2000,
  "accuracyBucket": "low"
}
[2026-01-12T06:04:14.193Z] INFO  DISTANCE_UPDATE [ActiveAlarm] (actionId: 182)
  Data: {
  "distanceMetersRounded": 5100,
  "radiusMeters": 2000,
  "accuracyBucket": "low"
}
[2026-01-12T06:04:18.636Z] INFO  SCREEN_VIEW [HomeLanding] (actionId: 183)
  Data: {
  "route": "HomeLanding"
}
[2026-01-12T06:04:19.897Z] INFO  SCREEN_VIEW [ActiveAlarm] (actionId: 184)
  Data: {
  "route": "ActiveAlarm"
}
[2026-01-12T06:04:22.462Z] INFO  LOCATION_TASK_TICK [ActiveAlarm] (actionId: 185)
  Data: {
  "hasLocations": true,
  "count": 1,
  "accuracyBucket": "low"
}
[2026-01-12T06:04:22.470Z] INFO  DISTANCE_UPDATE [ActiveAlarm] (actionId: 186)
  Data: {
  "distanceMetersRounded": 5370,
  "radiusMeters": 2000,
  "accuracyBucket": "low"
}
[2026-01-12T06:04:27.661Z] INFO  DISTANCE_UPDATE [ActiveAlarm] (actionId: 187)
  Data: {
  "distanceMetersRounded": 4890,
  "radiusMeters": 2000,
  "accuracyBucket": "low"
}
[2026-01-12T06:04:33.023Z] INFO  DISTANCE_UPDATE [ActiveAlarm] (actionId: 188)
  Data: {
  "distanceMetersRounded": 4890,
  "radiusMeters": 2000,
  "accuracyBucket": "low"
}
[2026-01-12T06:04:38.638Z] INFO  LOCATION_TASK_TICK [ActiveAlarm] (actionId: 189)
  Data: {
  "hasLocations": true,
  "count": 1,
  "accuracyBucket": "low"
}
[2026-01-12T06:04:38.652Z] INFO  DISTANCE_UPDATE [ActiveAlarm] (actionId: 190)
  Data: {
  "distanceMetersRounded": 4890,
  "radiusMeters": 2000,
  "accuracyBucket": "low"
}
[2026-01-12T06:04:39.249Z] INFO  SCREEN_VIEW [HomeLanding] (actionId: 191)
  Data: {
  "route": "HomeLanding"
}
[2026-01-12T06:04:43.657Z] INFO  SCREEN_VIEW [ActiveAlarm] (actionId: 192)
  Data: {
  "route": "ActiveAlarm"
}
[2026-01-12T06:04:46.279Z] INFO  DISTANCE_UPDATE [ActiveAlarm] (actionId: 193)
  Data: {
  "distanceMetersRounded": 4560,
  "radiusMeters": 2000,
  "accuracyBucket": "low"
}
[2026-01-12T06:04:48.756Z] INFO  APP_BACKGROUND [ActiveAlarm] (actionId: 194)
[2026-01-12T06:12:23.997Z] INFO  ALARM_TRIGGERED [ActiveAlarm] (actionId: 195)
  Data: {
  "source": "location"
}
[2026-01-12T06:12:23.997Z] INFO  ALARM_SESSION_STOP [ActiveAlarm] (actionId: 196)
  Data: {
  "reason": "triggered"
}
[2026-01-12T06:12:24.795Z] INFO  SCREEN_VIEW [AlarmTriggered] (actionId: 197)
  Data: {
  "route": "AlarmTriggered"
}
[2026-01-12T06:12:33.935Z] INFO  APP_FOREGROUND [AlarmTriggered] (actionId: 198)
[2026-01-12T06:12:33.938Z] INFO  APP_BACKGROUND [AlarmTriggered] (actionId: 199)
[2026-01-12T06:12:34.143Z] INFO  APP_FOREGROUND [AlarmTriggered] (actionId: 200)
[2026-01-12T06:12:34.941Z] INFO  SCREEN_VIEW [HomeLanding] (actionId: 201)
  Data: {
  "route": "HomeLanding"
}
[2026-01-12T06:12:37.875Z] INFO  APP_BACKGROUND [HomeLanding] (actionId: 202)
[2026-01-12T06:12:44.975Z] INFO  APP_READY [HomeLanding] (actionId: 203)
[2026-01-12T06:12:44.981Z] INFO  AUTH_STATE [HomeLanding] (actionId: 204)
  Data: {
  "state": "SIGNED_IN"
}
[2026-01-12T06:12:45.029Z] INFO  SCREEN_VIEW [HomeLanding] (actionId: 205)
  Data: {
  "route": "HomeLanding"
}
[2026-01-12T06:12:46.365Z] INFO  SCREEN_VIEW [SettingsHome] (actionId: 206)
  Data: {
  "route": "SettingsHome"
}
[2026-01-12T06:12:48.915Z] INFO  SCREEN_VIEW [Diagnostics] (actionId: 207)
  Data: {
  "route": "Diagnostics"
}

=== JSONL ===
{"t":1768162384507,"iso":"2026-01-11T20:13:04.507Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":8,"data":{"route":"HomeLanding"}}
{"t":1768162385855,"iso":"2026-01-11T20:13:05.855Z","level":"info","name":"STOP_SEARCH_OPEN","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":9,"data":{"initialTab":"stops"}}
{"t":1768162385856,"iso":"2026-01-11T20:13:05.856Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":10,"data":{"route":"StopSearch"}}
{"t":1768162388391,"iso":"2026-01-11T20:13:08.391Z","level":"info","name":"STOP_SEARCH_SUBMIT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":11,"data":{"queryLen":2}}
{"t":1768162388454,"iso":"2026-01-11T20:13:08.454Z","level":"info","name":"STOP_SEARCH_INPUT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":12,"data":{"queryLen":2}}
{"t":1768162389613,"iso":"2026-01-11T20:13:09.613Z","level":"info","name":"STOP_SEARCH_SUBMIT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":13,"data":{"queryLen":5}}
{"t":1768162389670,"iso":"2026-01-11T20:13:09.670Z","level":"info","name":"STOP_SEARCH_INPUT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":14,"data":{"queryLen":5}}
{"t":1768162390641,"iso":"2026-01-11T20:13:10.641Z","level":"info","name":"STOP_SEARCH_SUBMIT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":15,"data":{"queryLen":6}}
{"t":1768162390704,"iso":"2026-01-11T20:13:10.704Z","level":"info","name":"STOP_SEARCH_INPUT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":16,"data":{"queryLen":6}}
{"t":1768162397899,"iso":"2026-01-11T20:13:17.899Z","level":"info","name":"STOP_SEARCH_RESULTS","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":17,"data":{"count":25,"source":"network","durationMs":7215,"cacheHit":false}}
{"t":1768162402800,"iso":"2026-01-11T20:13:22.800Z","level":"info","name":"FAVORITE_ADD","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":18,"data":{"stopIdHash":"bf50acf7"}}
{"t":1768162404856,"iso":"2026-01-11T20:13:24.856Z","level":"info","name":"LINE_SEARCH_RESULTS","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":19,"data":{"count":800,"source":"network","durationMs":841,"cacheHit":false}}
{"t":1768162414215,"iso":"2026-01-11T20:13:34.215Z","level":"info","name":"STOP_PICK_FROM_LIST","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":20,"data":{"stopIdHash":"7cc53e2a"}}
{"t":1768162414232,"iso":"2026-01-11T20:13:34.232Z","level":"info","name":"MAP_MARKERS_RENDER","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":21,"data":{"count":1}}
{"t":1768162414243,"iso":"2026-01-11T20:13:34.243Z","level":"info","name":"HOME_MAP_MOUNT_START","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":22,"data":{"hasRoute":true,"hasParams":true,"mode":"STOP_PREVIEW"}}
{"t":1768162414243,"iso":"2026-01-11T20:13:34.243Z","level":"info","name":"HOME_MAP_COMPONENT_MOUNTED","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":23,"data":{"hasUser":true,"hasActiveAlarm":false,"mode":"STOP_PREVIEW","canUseMaps":true,"hasMapView":true,"hasRoute":true,"hasParams":true}}
{"t":1768162414243,"iso":"2026-01-11T20:13:34.243Z","level":"info","name":"MAP_MOUNT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":24,"data":{"provider":"google","hasAndroidKey":true,"hasIOSKey":true,"hasWebKey":true,"androidKeyLength":0,"androidKeyPrefix":"EMPTY"}}
{"t":1768162414243,"iso":"2026-01-11T20:13:34.243Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":25,"data":{"route":"HomeMap"}}
{"t":1768162414497,"iso":"2026-01-11T20:13:34.497Z","level":"info","name":"MAP_READY","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":26,"data":{"msFromMount":254}}
{"t":1768162419254,"iso":"2026-01-11T20:13:39.254Z","level":"warn","name":"MAP_ERROR","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":27,"data":{"reason":"blank_after_ready","warning":"MAP_READY fired but map tiles may not be loading - check API key in AndroidManifest.xml"}}
{"t":1768162421609,"iso":"2026-01-11T20:13:41.609Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"AlarmDetails","actionId":28,"data":{"route":"AlarmDetails"}}
{"t":1768162424086,"iso":"2026-01-11T20:13:44.086Z","level":"info","name":"MAP_REGION_CHANGE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"AlarmDetails","actionId":29,"data":{"zoomApprox":118,"moved":true}}
{"t":1768162424653,"iso":"2026-01-11T20:13:44.653Z","level":"info","name":"MAP_MARKERS_RENDER","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"AlarmDetails","actionId":30,"data":{"count":1}}
{"t":1768162424663,"iso":"2026-01-11T20:13:44.663Z","level":"info","name":"HOME_MAP_MOUNT_START","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"AlarmDetails","actionId":31,"data":{"hasRoute":true,"hasParams":true,"mode":"STOP_PREVIEW"}}
{"t":1768162424664,"iso":"2026-01-11T20:13:44.664Z","level":"info","name":"HOME_MAP_COMPONENT_MOUNTED","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"AlarmDetails","actionId":32,"data":{"hasUser":true,"hasActiveAlarm":false,"mode":"STOP_PREVIEW","canUseMaps":true,"hasMapView":true,"hasRoute":true,"hasParams":true}}
{"t":1768162424664,"iso":"2026-01-11T20:13:44.664Z","level":"info","name":"MAP_MOUNT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"AlarmDetails","actionId":33,"data":{"provider":"google","hasAndroidKey":true,"hasIOSKey":true,"hasWebKey":true,"androidKeyLength":0,"androidKeyPrefix":"EMPTY"}}
{"t":1768162424664,"iso":"2026-01-11T20:13:44.664Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":34,"data":{"route":"HomeMap"}}
{"t":1768162424674,"iso":"2026-01-11T20:13:44.674Z","level":"info","name":"MAP_READY","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":35,"data":{"msFromMount":10}}
{"t":1768162426681,"iso":"2026-01-11T20:13:46.681Z","level":"info","name":"HOME_MAP_COMPONENT_UNMOUNT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":36}
{"t":1768162426682,"iso":"2026-01-11T20:13:46.682Z","level":"info","name":"HOME_MAP_COMPONENT_UNMOUNT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":37}
{"t":1768162426684,"iso":"2026-01-11T20:13:46.684Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":38,"data":{"route":"HomeLanding"}}
{"t":1768162428031,"iso":"2026-01-11T20:13:48.031Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopsHome","actionId":39,"data":{"route":"StopsHome"}}
{"t":1768162428049,"iso":"2026-01-11T20:13:48.049Z","level":"info","name":"FAVORITES_LOAD","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopsHome","actionId":40,"data":{"count":1}}
{"t":1768162428646,"iso":"2026-01-11T20:13:48.646Z","level":"info","name":"MAP_REGION_CHANGE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopsHome","actionId":41,"data":{"zoomApprox":118,"moved":true}}
{"t":1768162429679,"iso":"2026-01-11T20:13:49.679Z","level":"warn","name":"MAP_ERROR","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopsHome","actionId":42,"data":{"reason":"blank_after_ready","warning":"MAP_READY fired but map tiles may not be loading - check API key in AndroidManifest.xml"}}
{"t":1768162431050,"iso":"2026-01-11T20:13:51.050Z","level":"info","name":"FAVORITES_LOAD","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopsHome","actionId":43,"data":{"count":1}}
{"t":1768162433485,"iso":"2026-01-11T20:13:53.485Z","level":"info","name":"FAVORITES_LOAD","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopsHome","actionId":44,"data":{"count":1}}
{"t":1768162434666,"iso":"2026-01-11T20:13:54.666Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":45,"data":{"route":"HomeLanding"}}
{"t":1768162451046,"iso":"2026-01-11T20:14:11.046Z","level":"info","name":"ALARM_SESSION_START","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"AWccEXO8WSw7WiiKe7z0","screen":"HomeLanding","actionId":46,"data":{"stopIdHash":"de95b36d","radiusMeters":400,"startedInside":false}}
{"t":1768162451227,"iso":"2026-01-11T20:14:11.227Z","level":"info","name":"DISTANCE_UPDATE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"AWccEXO8WSw7WiiKe7z0","screen":"HomeLanding","actionId":47,"data":{"distanceMetersRounded":11380,"radiusMeters":400,"accuracyBucket":"low"}}
{"t":1768162451312,"iso":"2026-01-11T20:14:11.312Z","level":"info","name":"TRACKING_START","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"AWccEXO8WSw7WiiKe7z0","screen":"HomeLanding","actionId":48,"data":{"success":true}}
{"t":1768162451333,"iso":"2026-01-11T20:14:11.333Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"AWccEXO8WSw7WiiKe7z0","screen":"ActiveAlarm","actionId":49,"data":{"route":"ActiveAlarm"}}
{"t":1768162459847,"iso":"2026-01-11T20:14:19.847Z","level":"info","name":"TRACKING_STOP","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"AWccEXO8WSw7WiiKe7z0","screen":"ActiveAlarm","actionId":50,"data":{"success":true}}
{"t":1768162459847,"iso":"2026-01-11T20:14:19.847Z","level":"info","name":"ALARM_SESSION_STOP","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"AWccEXO8WSw7WiiKe7z0","screen":"ActiveAlarm","actionId":51,"data":{"reason":"user_stop"}}
{"t":1768162459866,"iso":"2026-01-11T20:14:19.866Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":52,"data":{"route":"HomeLanding"}}
{"t":1768162462325,"iso":"2026-01-11T20:14:22.325Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopsHome","actionId":53,"data":{"route":"StopsHome"}}
{"t":1768162465468,"iso":"2026-01-11T20:14:25.468Z","level":"info","name":"FAVORITES_LOAD","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopsHome","actionId":54,"data":{"count":1}}
{"t":1768162466281,"iso":"2026-01-11T20:14:26.281Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":55,"data":{"route":"HomeLanding"}}
{"t":1768162468996,"iso":"2026-01-11T20:14:28.996Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopsHome","actionId":56,"data":{"route":"StopsHome"}}
{"t":1768162470864,"iso":"2026-01-11T20:14:30.864Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":57,"data":{"route":"HomeLanding"}}
{"t":1768162475264,"iso":"2026-01-11T20:14:35.264Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopsHome","actionId":58,"data":{"route":"StopsHome"}}
{"t":1768162476927,"iso":"2026-01-11T20:14:36.927Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":59,"data":{"route":"HomeLanding"}}
{"t":1768162478782,"iso":"2026-01-11T20:14:38.782Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopsHome","actionId":60,"data":{"route":"StopsHome"}}
{"t":1768162480093,"iso":"2026-01-11T20:14:40.093Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":61,"data":{"route":"HomeLanding"}}
{"t":1768162485801,"iso":"2026-01-11T20:14:45.801Z","level":"info","name":"STOP_SEARCH_OPEN","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":62,"data":{"initialTab":"stops"}}
{"t":1768162485801,"iso":"2026-01-11T20:14:45.801Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":63,"data":{"route":"StopSearch"}}
{"t":1768162485821,"iso":"2026-01-11T20:14:45.821Z","level":"info","name":"FAVORITES_LOAD","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":64,"data":{"count":1}}
{"t":1768162488471,"iso":"2026-01-11T20:14:48.471Z","level":"info","name":"STOP_SEARCH_SUBMIT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":65,"data":{"queryLen":5}}
{"t":1768162488488,"iso":"2026-01-11T20:14:48.488Z","level":"info","name":"STOP_SEARCH_RESULTS","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":66,"data":{"count":25,"source":"network","durationMs":1,"cacheHit":false}}
{"t":1768162488915,"iso":"2026-01-11T20:14:48.915Z","level":"info","name":"STOP_SEARCH_RESULTS","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":67,"data":{"count":25,"source":"cache","cacheHit":true}}
{"t":1768162488957,"iso":"2026-01-11T20:14:48.957Z","level":"info","name":"STOP_SEARCH_INPUT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":68,"data":{"queryLen":6}}
{"t":1768162490799,"iso":"2026-01-11T20:14:50.799Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":69,"data":{"route":"HomeLanding"}}
{"t":1768162491586,"iso":"2026-01-11T20:14:51.586Z","level":"info","name":"HOME_MAP_BUTTON_PRESS","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":70,"data":{"from":"HomeLanding","action":"quick_action_map_button"}}
{"t":1768162491586,"iso":"2026-01-11T20:14:51.586Z","level":"info","name":"HOME_MAP_NAVIGATE_ATTEMPT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":71,"data":{"from":"HomeLanding","action":"quick_action_map"}}
{"t":1768162491601,"iso":"2026-01-11T20:14:51.601Z","level":"info","name":"MAP_MARKERS_RENDER","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":72,"data":{"count":0}}
{"t":1768162491611,"iso":"2026-01-11T20:14:51.611Z","level":"info","name":"HOME_MAP_MOUNT_START","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":73,"data":{"hasRoute":true,"hasParams":false,"mode":"undefined"}}
{"t":1768162491611,"iso":"2026-01-11T20:14:51.611Z","level":"info","name":"HOME_MAP_COMPONENT_MOUNTED","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":74,"data":{"hasUser":true,"hasActiveAlarm":false,"mode":"undefined","canUseMaps":true,"hasMapView":true,"hasRoute":true,"hasParams":false}}
{"t":1768162491611,"iso":"2026-01-11T20:14:51.611Z","level":"info","name":"MAP_MOUNT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":75,"data":{"provider":"google","hasAndroidKey":true,"hasIOSKey":true,"hasWebKey":true,"androidKeyLength":0,"androidKeyPrefix":"EMPTY"}}
{"t":1768162491612,"iso":"2026-01-11T20:14:51.612Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":76,"data":{"route":"HomeMap"}}
{"t":1768162491641,"iso":"2026-01-11T20:14:51.641Z","level":"info","name":"MAP_READY","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":77,"data":{"msFromMount":30}}
{"t":1768162492844,"iso":"2026-01-11T20:14:52.844Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":78,"data":{"hasLocations":true,"count":1,"accuracyBucket":"mid"}}
{"t":1768162496614,"iso":"2026-01-11T20:14:56.614Z","level":"warn","name":"MAP_ERROR","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":79,"data":{"reason":"blank_after_ready","warning":"MAP_READY fired but map tiles may not be loading - check API key in AndroidManifest.xml"}}
{"t":1768162508051,"iso":"2026-01-11T20:15:08.051Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":80,"data":{"route":"Diagnostics"}}
{"t":1768162510090,"iso":"2026-01-11T20:15:10.090Z","level":"info","name":"MAP_REGION_CHANGE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":81,"data":{"zoomApprox":18,"moved":true}}
{"t":1768162512240,"iso":"2026-01-11T20:15:12.240Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":82,"data":{"hasLocations":true,"count":1,"accuracyBucket":"mid"}}
{"t":1768162512263,"iso":"2026-01-11T20:15:12.263Z","level":"info","name":"APP_BACKGROUND","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":83}
{"t":1768162512651,"iso":"2026-01-11T20:15:12.651Z","level":"info","name":"HOME_MAP_COMPONENT_UNMOUNT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":84}
{"t":1768168958905,"iso":"2026-01-11T22:02:38.907Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":85,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768168986586,"iso":"2026-01-11T22:03:06.586Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":86,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169012990,"iso":"2026-01-11T22:03:32.990Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":87,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169036625,"iso":"2026-01-11T22:03:56.625Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":88,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169063257,"iso":"2026-01-11T22:04:23.257Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":89,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169090316,"iso":"2026-01-11T22:04:50.316Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":90,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169116755,"iso":"2026-01-11T22:05:16.755Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":91,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169143434,"iso":"2026-01-11T22:05:43.434Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":92,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169169800,"iso":"2026-01-11T22:06:09.800Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":93,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169196270,"iso":"2026-01-11T22:06:36.270Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":94,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169222418,"iso":"2026-01-11T22:07:02.418Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":95,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169268614,"iso":"2026-01-11T22:07:48.614Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":96,"data":{"hasLocations":true,"count":1,"accuracyBucket":"mid"}}
{"t":1768169287658,"iso":"2026-01-11T22:08:07.658Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":97,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169314830,"iso":"2026-01-11T22:08:34.830Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":98,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169341650,"iso":"2026-01-11T22:09:01.650Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":99,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169368225,"iso":"2026-01-11T22:09:28.225Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":100,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169395441,"iso":"2026-01-11T22:09:55.441Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":101,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169422051,"iso":"2026-01-11T22:10:22.051Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":102,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169448674,"iso":"2026-01-11T22:10:48.674Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":103,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169512082,"iso":"2026-01-11T22:11:52.082Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":104,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768169665802,"iso":"2026-01-11T22:14:25.802Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":105,"data":{"hasLocations":true,"count":1,"accuracyBucket":"mid"}}
{"t":1768169693980,"iso":"2026-01-11T22:14:53.980Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":106,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768195613864,"iso":"2026-01-12T05:26:53.864Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":107,"data":{"hasLocations":true,"count":1,"accuracyBucket":"low"}}
{"t":1768195633580,"iso":"2026-01-12T05:27:13.580Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":108,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768195660986,"iso":"2026-01-12T05:27:40.986Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":109,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768195688946,"iso":"2026-01-12T05:28:08.946Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":110,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768195716258,"iso":"2026-01-12T05:28:36.258Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":111,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768195839127,"iso":"2026-01-12T05:30:39.127Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":112,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768195914902,"iso":"2026-01-12T05:31:54.902Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":113,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768196660371,"iso":"2026-01-12T05:44:20.371Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":114,"data":{"hasLocations":true,"count":50,"accuracyBucket":"mid"}}
{"t":1768196676852,"iso":"2026-01-12T05:44:36.852Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":115,"data":{"hasLocations":true,"count":1,"accuracyBucket":"mid"}}
{"t":1768196695754,"iso":"2026-01-12T05:44:55.754Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":116,"data":{"hasLocations":true,"count":1,"accuracyBucket":"mid"}}
{"t":1768196715549,"iso":"2026-01-12T05:45:15.549Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":117,"data":{"hasLocations":true,"count":1,"accuracyBucket":"mid"}}
{"t":1768196731889,"iso":"2026-01-12T05:45:31.889Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":118,"data":{"hasLocations":true,"count":1,"accuracyBucket":"mid"}}
{"t":1768196751897,"iso":"2026-01-12T05:45:51.897Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":119,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768196771547,"iso":"2026-01-12T05:46:11.547Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":120,"data":{"hasLocations":true,"count":1,"accuracyBucket":"mid"}}
{"t":1768196791041,"iso":"2026-01-12T05:46:31.041Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":121,"data":{"hasLocations":true,"count":1,"accuracyBucket":"mid"}}
{"t":1768196808926,"iso":"2026-01-12T05:46:48.926Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":122,"data":{"hasLocations":true,"count":1,"accuracyBucket":"mid"}}
{"t":1768196828619,"iso":"2026-01-12T05:47:08.619Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":123,"data":{"hasLocations":true,"count":1,"accuracyBucket":"low"}}
{"t":1768196848071,"iso":"2026-01-12T05:47:28.071Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":124,"data":{"hasLocations":true,"count":1,"accuracyBucket":"low"}}
{"t":1768196865027,"iso":"2026-01-12T05:47:45.027Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":125,"data":{"hasLocations":true,"count":1,"accuracyBucket":"low"}}
{"t":1768196882334,"iso":"2026-01-12T05:48:02.334Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":126,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768196899191,"iso":"2026-01-12T05:48:19.191Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":127,"data":{"hasLocations":true,"count":1,"accuracyBucket":"mid"}}
{"t":1768196918883,"iso":"2026-01-12T05:48:38.883Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":128,"data":{"hasLocations":true,"count":1,"accuracyBucket":"mid"}}
{"t":1768196940436,"iso":"2026-01-12T05:49:00.436Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":129,"data":{"hasLocations":true,"count":1,"accuracyBucket":"mid"}}
{"t":1768196961887,"iso":"2026-01-12T05:49:21.887Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":130,"data":{"hasLocations":true,"count":1,"accuracyBucket":"low"}}
{"t":1768196981389,"iso":"2026-01-12T05:49:41.389Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":131,"data":{"hasLocations":true,"count":1,"accuracyBucket":"low"}}
{"t":1768197790675,"iso":"2026-01-12T06:03:10.675Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":134,"data":{"hasLocations":true,"count":128,"accuracyBucket":"high"}}
{"t":1768197790731,"iso":"2026-01-12T06:03:10.731Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":135,"data":{"route":"HomeLanding"}}
{"t":1768197793036,"iso":"2026-01-12T06:03:13.036Z","level":"info","name":"HOME_MAP_BUTTON_PRESS","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":136,"data":{"from":"HomeLanding","action":"quick_action_map_button"}}
{"t":1768197793036,"iso":"2026-01-12T06:03:13.036Z","level":"info","name":"HOME_MAP_NAVIGATE_ATTEMPT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":137,"data":{"from":"HomeLanding","action":"quick_action_map"}}
{"t":1768197793043,"iso":"2026-01-12T06:03:13.043Z","level":"info","name":"MAP_MARKERS_RENDER","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":138,"data":{"count":0}}
{"t":1768197793058,"iso":"2026-01-12T06:03:13.058Z","level":"info","name":"HOME_MAP_MOUNT_START","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":139,"data":{"hasRoute":true,"hasParams":false,"mode":"undefined"}}
{"t":1768197793058,"iso":"2026-01-12T06:03:13.058Z","level":"info","name":"HOME_MAP_COMPONENT_MOUNTED","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":140,"data":{"hasUser":true,"hasActiveAlarm":false,"mode":"undefined","canUseMaps":true,"hasMapView":true,"hasRoute":true,"hasParams":false}}
{"t":1768197793058,"iso":"2026-01-12T06:03:13.058Z","level":"info","name":"MAP_MOUNT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":141,"data":{"provider":"google","hasAndroidKey":true,"hasIOSKey":true,"hasWebKey":true,"androidKeyLength":0,"androidKeyPrefix":"EMPTY"}}
{"t":1768197793059,"iso":"2026-01-12T06:03:13.059Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":142,"data":{"route":"HomeMap"}}
{"t":1768197793114,"iso":"2026-01-12T06:03:13.114Z","level":"info","name":"MAP_READY","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":143,"data":{"msFromMount":56}}
{"t":1768197798063,"iso":"2026-01-12T06:03:18.063Z","level":"warn","name":"MAP_ERROR","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":144,"data":{"reason":"blank_after_ready","warning":"MAP_READY fired but map tiles may not be loading - check API key in AndroidManifest.xml"}}
{"t":1768197802868,"iso":"2026-01-12T06:03:22.868Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":145,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768197811339,"iso":"2026-01-12T06:03:31.339Z","level":"info","name":"STOP_SEARCH_OPEN","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":146,"data":{"initialTab":"stops"}}
{"t":1768197811340,"iso":"2026-01-12T06:03:31.340Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":147,"data":{"route":"StopSearch"}}
{"t":1768197811346,"iso":"2026-01-12T06:03:31.346Z","level":"info","name":"FAVORITES_LOAD","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":148,"data":{"count":1}}
{"t":1768197811546,"iso":"2026-01-12T06:03:31.546Z","level":"info","name":"FAVORITES_LOAD","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":149,"data":{"count":7}}
{"t":1768197813802,"iso":"2026-01-12T06:03:33.802Z","level":"info","name":"MAP_REGION_CHANGE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":150,"data":{"zoomApprox":18,"moved":true}}
{"t":1768197814588,"iso":"2026-01-12T06:03:34.588Z","level":"info","name":"STOP_SEARCH_SUBMIT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":151,"data":{"queryLen":7}}
{"t":1768197814662,"iso":"2026-01-12T06:03:34.662Z","level":"info","name":"STOP_SEARCH_INPUT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":152,"data":{"queryLen":7}}
{"t":1768197815796,"iso":"2026-01-12T06:03:35.796Z","level":"info","name":"STOP_SEARCH_SUBMIT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":153,"data":{"queryLen":10}}
{"t":1768197815872,"iso":"2026-01-12T06:03:35.872Z","level":"info","name":"STOP_SEARCH_INPUT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":154,"data":{"queryLen":10}}
{"t":1768197817428,"iso":"2026-01-12T06:03:37.428Z","level":"info","name":"STOP_SEARCH_SUBMIT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":155,"data":{"queryLen":9}}
{"t":1768197817505,"iso":"2026-01-12T06:03:37.505Z","level":"info","name":"STOP_SEARCH_INPUT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":156,"data":{"queryLen":9}}
{"t":1768197818198,"iso":"2026-01-12T06:03:38.198Z","level":"info","name":"STOP_SEARCH_SUBMIT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":157,"data":{"queryLen":10}}
{"t":1768197818271,"iso":"2026-01-12T06:03:38.271Z","level":"info","name":"STOP_SEARCH_INPUT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":158,"data":{"queryLen":10}}
{"t":1768197820880,"iso":"2026-01-12T06:03:40.880Z","level":"info","name":"STOP_SEARCH_RESULTS","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":159,"data":{"count":10,"source":"network","durationMs":2653,"cacheHit":false}}
{"t":1768197825160,"iso":"2026-01-12T06:03:45.160Z","level":"info","name":"STOP_PICK_FROM_LIST","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":160,"data":{"stopIdHash":"47770ebc"}}
{"t":1768197825174,"iso":"2026-01-12T06:03:45.174Z","level":"info","name":"MAP_MARKERS_RENDER","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":161,"data":{"count":1}}
{"t":1768197825185,"iso":"2026-01-12T06:03:45.185Z","level":"info","name":"HOME_MAP_MOUNT_START","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":162,"data":{"hasRoute":true,"hasParams":true,"mode":"STOP_PREVIEW"}}
{"t":1768197825185,"iso":"2026-01-12T06:03:45.185Z","level":"info","name":"HOME_MAP_COMPONENT_MOUNTED","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":163,"data":{"hasUser":true,"hasActiveAlarm":false,"mode":"STOP_PREVIEW","canUseMaps":true,"hasMapView":true,"hasRoute":true,"hasParams":true}}
{"t":1768197825185,"iso":"2026-01-12T06:03:45.185Z","level":"info","name":"MAP_MOUNT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"StopSearch","actionId":164,"data":{"provider":"google","hasAndroidKey":true,"hasIOSKey":true,"hasWebKey":true,"androidKeyLength":0,"androidKeyPrefix":"EMPTY"}}
{"t":1768197825186,"iso":"2026-01-12T06:03:45.186Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":165,"data":{"route":"HomeMap"}}
{"t":1768197825217,"iso":"2026-01-12T06:03:45.217Z","level":"info","name":"MAP_READY","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeMap","actionId":166,"data":{"msFromMount":32}}
{"t":1768197829733,"iso":"2026-01-12T06:03:49.733Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"AlarmDetails","actionId":167,"data":{"route":"AlarmDetails"}}
{"t":1768197830192,"iso":"2026-01-12T06:03:50.192Z","level":"warn","name":"MAP_ERROR","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"AlarmDetails","actionId":168,"data":{"reason":"blank_after_ready","warning":"MAP_READY fired but map tiles may not be loading - check API key in AndroidManifest.xml"}}
{"t":1768197832178,"iso":"2026-01-12T06:03:52.178Z","level":"info","name":"MAP_REGION_CHANGE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"AlarmDetails","actionId":169,"data":{"zoomApprox":100,"moved":true}}
{"t":1768197836013,"iso":"2026-01-12T06:03:56.013Z","level":"info","name":"ALARM_SESSION_START","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"AlarmDetails","actionId":170,"data":{"stopIdHash":"47770ebc","radiusMeters":2000,"startedInside":false}}
{"t":1768197836164,"iso":"2026-01-12T06:03:56.164Z","level":"info","name":"TRACKING_START","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"AlarmDetails","actionId":171,"data":{"success":true}}
{"t":1768197836187,"iso":"2026-01-12T06:03:56.187Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":172,"data":{"route":"ActiveAlarm"}}
{"t":1768197845403,"iso":"2026-01-12T06:04:05.403Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"HomeMap","actionId":173,"data":{"route":"HomeMap"}}
{"t":1768197847274,"iso":"2026-01-12T06:04:07.274Z","level":"info","name":"HOME_MAP_COMPONENT_UNMOUNT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"HomeMap","actionId":174}
{"t":1768197847275,"iso":"2026-01-12T06:04:07.275Z","level":"info","name":"HOME_MAP_COMPONENT_UNMOUNT","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"HomeMap","actionId":175}
{"t":1768197847275,"iso":"2026-01-12T06:04:07.275Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"HomeLanding","actionId":176,"data":{"route":"HomeLanding"}}
{"t":1768197848173,"iso":"2026-01-12T06:04:08.173Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":177,"data":{"route":"ActiveAlarm"}}
{"t":1768197848269,"iso":"2026-01-12T06:04:08.269Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":178,"data":{"hasLocations":true,"count":1,"accuracyBucket":"high"}}
{"t":1768197848280,"iso":"2026-01-12T06:04:08.280Z","level":"info","name":"DISTANCE_UPDATE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":179,"data":{"distanceMetersRounded":5100,"radiusMeters":2000,"accuracyBucket":"high"}}
{"t":1768197849253,"iso":"2026-01-12T06:04:09.253Z","level":"info","name":"MAP_REGION_CHANGE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":180,"data":{"zoomApprox":84,"moved":true}}
{"t":1768197853293,"iso":"2026-01-12T06:04:13.293Z","level":"info","name":"DISTANCE_UPDATE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":181,"data":{"distanceMetersRounded":5100,"radiusMeters":2000,"accuracyBucket":"low"}}
{"t":1768197854193,"iso":"2026-01-12T06:04:14.193Z","level":"info","name":"DISTANCE_UPDATE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":182,"data":{"distanceMetersRounded":5100,"radiusMeters":2000,"accuracyBucket":"low"}}
{"t":1768197858636,"iso":"2026-01-12T06:04:18.636Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"HomeLanding","actionId":183,"data":{"route":"HomeLanding"}}
{"t":1768197859897,"iso":"2026-01-12T06:04:19.897Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":184,"data":{"route":"ActiveAlarm"}}
{"t":1768197862462,"iso":"2026-01-12T06:04:22.462Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":185,"data":{"hasLocations":true,"count":1,"accuracyBucket":"low"}}
{"t":1768197862470,"iso":"2026-01-12T06:04:22.470Z","level":"info","name":"DISTANCE_UPDATE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":186,"data":{"distanceMetersRounded":5370,"radiusMeters":2000,"accuracyBucket":"low"}}
{"t":1768197867661,"iso":"2026-01-12T06:04:27.661Z","level":"info","name":"DISTANCE_UPDATE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":187,"data":{"distanceMetersRounded":4890,"radiusMeters":2000,"accuracyBucket":"low"}}
{"t":1768197873023,"iso":"2026-01-12T06:04:33.023Z","level":"info","name":"DISTANCE_UPDATE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":188,"data":{"distanceMetersRounded":4890,"radiusMeters":2000,"accuracyBucket":"low"}}
{"t":1768197878638,"iso":"2026-01-12T06:04:38.638Z","level":"info","name":"LOCATION_TASK_TICK","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":189,"data":{"hasLocations":true,"count":1,"accuracyBucket":"low"}}
{"t":1768197878652,"iso":"2026-01-12T06:04:38.652Z","level":"info","name":"DISTANCE_UPDATE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":190,"data":{"distanceMetersRounded":4890,"radiusMeters":2000,"accuracyBucket":"low"}}
{"t":1768197879249,"iso":"2026-01-12T06:04:39.249Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"HomeLanding","actionId":191,"data":{"route":"HomeLanding"}}
{"t":1768197883657,"iso":"2026-01-12T06:04:43.657Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":192,"data":{"route":"ActiveAlarm"}}
{"t":1768197886279,"iso":"2026-01-12T06:04:46.279Z","level":"info","name":"DISTANCE_UPDATE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":193,"data":{"distanceMetersRounded":4560,"radiusMeters":2000,"accuracyBucket":"low"}}
{"t":1768197888756,"iso":"2026-01-12T06:04:48.756Z","level":"info","name":"APP_BACKGROUND","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":194}
{"t":1768198343997,"iso":"2026-01-12T06:12:23.997Z","level":"info","name":"ALARM_TRIGGERED","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":195,"data":{"source":"location"}}
{"t":1768198343997,"iso":"2026-01-12T06:12:23.997Z","level":"info","name":"ALARM_SESSION_STOP","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","alarmSessionId":"tbo6F6Tt4M3XFjARZAMz","screen":"ActiveAlarm","actionId":196,"data":{"reason":"triggered"}}
{"t":1768198344795,"iso":"2026-01-12T06:12:24.795Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"AlarmTriggered","actionId":197,"data":{"route":"AlarmTriggered"}}
{"t":1768198353935,"iso":"2026-01-12T06:12:33.935Z","level":"info","name":"APP_FOREGROUND","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"AlarmTriggered","actionId":198}
{"t":1768198353938,"iso":"2026-01-12T06:12:33.938Z","level":"info","name":"APP_BACKGROUND","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"AlarmTriggered","actionId":199}
{"t":1768198354143,"iso":"2026-01-12T06:12:34.143Z","level":"info","name":"APP_FOREGROUND","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"AlarmTriggered","actionId":200}
{"t":1768198354941,"iso":"2026-01-12T06:12:34.941Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":201,"data":{"route":"HomeLanding"}}
{"t":1768198357875,"iso":"2026-01-12T06:12:37.875Z","level":"info","name":"APP_BACKGROUND","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":202}
{"t":1768198364975,"iso":"2026-01-12T06:12:44.975Z","level":"info","name":"APP_READY","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":203}
{"t":1768198364981,"iso":"2026-01-12T06:12:44.981Z","level":"info","name":"AUTH_STATE","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":204,"data":{"state":"SIGNED_IN"}}
{"t":1768198365029,"iso":"2026-01-12T06:12:45.029Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"HomeLanding","actionId":205,"data":{"route":"HomeLanding"}}
{"t":1768198366365,"iso":"2026-01-12T06:12:46.365Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"SettingsHome","actionId":206,"data":{"route":"SettingsHome"}}
{"t":1768198368915,"iso":"2026-01-12T06:12:48.915Z","level":"info","name":"SCREEN_VIEW","sessionId":"996eaea1-ae29-4fcf-b723-6dd01968db9a","screen":"Diagnostics","actionId":207,"data":{"route":"Diagnostics"}}
=== END ===