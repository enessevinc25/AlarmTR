import { NavigatorScreenParams } from '@react-navigation/native';
import { TransportMode } from '../types/models';
import { StartAlarmSessionParams } from '../context/AlarmContext';

export type RootStackParamList = {
  Splash: undefined;
  AuthWelcome: undefined;
  Login: { email?: string } | undefined;
  SignUp: undefined;
  ForgotPassword: { prefillEmail?: string } | undefined;
  OnboardingIntro: undefined;
  OnboardingPermissions: undefined;
  MainTabs: NavigatorScreenParams<MainTabsParamList> | undefined;
};

export type MainTabsParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  StopsTab: NavigatorScreenParams<StopsStackParamList> | undefined;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList> | undefined;
};

export type HomeStackParamList = {
  HomeLanding: undefined;
  HomeMap:
    | {
        mode?: 'DEFAULT' | 'STOP_PREVIEW' | 'PLACE_PREVIEW';
        stop?: {
          id: string;
          name: string;
          latitude: number;
          longitude: number;
        };
        place?: {
          name: string;
          latitude: number;
          longitude: number;
        };
      }
    | undefined;
  StopSearch:
    | {
        initialTab?: 'stops' | 'lines';
        preselectedCityId?: string;
        initialQuery?: string;
      }
    | undefined;
  AlarmDetails: {
    targetType: 'STOP' | 'CUSTOM';
    targetId: string;
    defaultDistanceMeters?: number;
    defaultTransportMode?: TransportMode;
    defaultMinutesBefore?: number;
  };
  ActiveAlarm: {
    alarmSessionId: string;
  };
  AlarmTriggered: {
    alarmSessionId: string;
  };
  AlarmPreflight: {
    startPayload: StartAlarmSessionParams;
  };
};

export type StopsStackParamList = {
  StopsHome: { initialTab?: 'favorites' | 'history' } | undefined;
  SavedStops: undefined;
  CustomTargetForm: { targetId?: string } | undefined;
  RouteFavorites: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  AlarmProfiles: undefined;
  AlarmSettings: undefined;
  PermissionsHelp: undefined;
  Account: undefined;
  SamsungBattery: undefined;
  Diagnostics: undefined;
  ReportIssue: undefined;
  AlarmDebug?: undefined; // Dev only
};

