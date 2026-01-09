import { Image, ImageSource } from 'expo-image';
import { StyleProp, ImageStyle } from 'react-native';

type Props = {
  source: ImageSource;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

/**
 * Disk cache + lazy load edilen görsel bileşeni
 * expo-image kullanır, fade transition ile placeholder davranışı sağlar.
 */
const CachedImage = ({ source, style, accessibilityLabel }: Props) => {
  return (
    <Image
      source={source}
      style={style}
      accessibilityLabel={accessibilityLabel}
      contentFit="cover"
      cachePolicy="disk"
      transition={150}
    />
  );
};

export default CachedImage;

