import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Clipboard } from 'react-native';
import { logger, getRecentLogsText } from '../../utils/logger';
import { diagSummarize, getLastSessionId } from '../../services/alarmDiagnostics';

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
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Logger'a yaz
    logger.error('ErrorBoundary caught error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      componentStack: errorInfo.componentStack,
    }).catch(() => {
      // Logger hatası: ignore
    });

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

  handleCopyDiagnostics = async () => {
    try {
      const lines: string[] = [];
      lines.push('=== ERROR BOUNDARY DIAGNOSTICS ===');
      lines.push('');
      
      if (this.state.error) {
        lines.push(`Error: ${this.state.error.name}`);
        lines.push(`Message: ${this.state.error.message}`);
        if (this.state.error.stack) {
          lines.push(`Stack: ${this.state.error.stack}`);
        }
        lines.push('');
      }

      if (this.state.errorInfo) {
        lines.push(`Component Stack: ${this.state.errorInfo.componentStack}`);
        lines.push('');
      }

      // Son alarm diagnostiği
      try {
        const lastSessionId = await getLastSessionId();
        if (lastSessionId) {
          const summary = await diagSummarize(lastSessionId);
          lines.push('=== LAST ALARM DIAGNOSTICS ===');
          lines.push(summary);
          lines.push('');
        }
      } catch {
        // Diagnostic hatası: skip
      }

      // Son loglar
      try {
        const logs = await getRecentLogsText();
        lines.push('=== RECENT LOGS ===');
        lines.push(logs);
      } catch {
        // Log hatası: skip
      }

      const text = lines.join('\n');
      await Clipboard.setString(text);
      
      if (__DEV__) {
        console.log('[ErrorBoundary] Diagnostics copied to clipboard');
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[ErrorBoundary] Failed to copy diagnostics:', error);
      }
    }
  };

  handleRestart = () => {
    // State'i reset et
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

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
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
              <Text style={styles.buttonText}>Yeniden Başlat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={this.handleCopyDiagnostics}>
              <Text style={styles.buttonTextSecondary}>Diagnostik Kopyala</Text>
            </TouchableOpacity>
          </View>
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
  buttonContainer: {
    marginTop: 24,
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#0E7490',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0E7490',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonTextSecondary: {
    color: '#0E7490',
    fontWeight: '600',
    fontSize: 16,
  },
});

