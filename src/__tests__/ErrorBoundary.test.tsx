import React from 'react';
import { render } from '@testing-library/react-native';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { Text } from 'react-native';

// Error fırlatan component
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Console.error'u suppress et
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Test content</Text>
      </ErrorBoundary>
    );

    expect(getByText('Test content')).toBeTruthy();
  });

  it('should render error message when error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Bir hata oluştu')).toBeTruthy();
    expect(getByText(/Uygulamada beklenmeyen bir hata meydana geldi/)).toBeTruthy();
  });

  it('should render fallback when provided', () => {
    const fallback = <Text>Custom fallback</Text>;
    const { getByText } = render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Custom fallback')).toBeTruthy();
  });
});

