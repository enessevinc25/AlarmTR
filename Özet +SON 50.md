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
Total Events: 65

=== LAST 50 EVENTS ===
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
[2026-01-10T13:11:28.995Z] INFO  APP_BACKGROUND [Diagnostics] (actionId: 10)
[2026-01-10T13:11:52.299Z] INFO  APP_FOREGROUND [Diagnostics] (actionId: 11)

=== END ===