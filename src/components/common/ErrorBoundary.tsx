import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Sentry import'u optional - Expo Go'da mevcut olmayabilir
type SentryModule = {
  Native: {
    captureException: (error: Error, context?: any) => void;
  };
};
let Sentry: SentryModule | null = null;
try {
  Sentry = require('sentry-expo') as SentryModule;
} catch {
  // Sentry mevcut değil, bu normal (özellikle Expo Go'da)
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary] Yakalanan hata:', error, errorInfo);
    }
    try {
      if (Sentry?.Native && typeof Sentry.Native.captureException === 'function') {
        Sentry.Native.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      }
    } catch (reportError) {
      // Sentry raporlama başarısız olsa bile ErrorBoundary yeni bir crash yaratmamalı
      if (__DEV__) {
        console.warn('[ErrorBoundary] Sentry raporlama hatası:', reportError);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Note: ErrorBoundary is a class component, cannot use hooks
      // Using light theme colors as fallback (dark mode will be handled by app-level theming)
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Bir hata oluştu</Text>
          <Text style={styles.message}>
            Uygulamada beklenmeyen bir hata meydana geldi. Lütfen uygulamayı yeniden başlatın.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.error}>{this.state.error.toString()}</Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc', // Light theme fallback (ErrorBoundary cannot use hooks)
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  error: {
    marginTop: 20,
    fontSize: 12,
    color: '#e11d48',
    fontFamily: 'monospace',
  },
});

