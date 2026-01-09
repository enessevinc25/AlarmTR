import { render, fireEvent } from '@testing-library/react-native';
import PrimaryButton from '../components/common/PrimaryButton';
import { ThemeProvider } from '../context/ThemeContext';

describe('PrimaryButton', () => {
  it('renders title and triggers onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <PrimaryButton title="Deneme" onPress={onPress} />
      </ThemeProvider>
    );

    const button = getByText('Deneme');
    fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

