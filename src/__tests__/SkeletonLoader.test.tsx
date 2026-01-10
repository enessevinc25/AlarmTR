import React from 'react';
import { render } from '@testing-library/react-native';
import { SkeletonLoader, SkeletonCard } from '../components/common/SkeletonLoader';

describe('SkeletonLoader', () => {
  it('should render with default props', () => {
    const { getByTestId } = render(<SkeletonLoader />);
    const component = getByTestId('skeleton-loader');
    expect(component).toBeTruthy();
  });

  it('should render with custom width and height', () => {
    const { getByTestId } = render(<SkeletonLoader width={200} height={50} />);
    const component = getByTestId('skeleton-loader');
    expect(component).toBeTruthy();
  });

  it('should render SkeletonCard', () => {
    const { UNSAFE_getByType } = render(<SkeletonCard />);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component = UNSAFE_getByType('View' as any);
    expect(component).toBeTruthy();
  });
});

