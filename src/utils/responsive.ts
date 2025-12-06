import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro / common baseline)
const BASE_WIDTH = 375;
const _BASE_HEIGHT = 812;

// Guideline sizes for scaling
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scale a value based on screen width
 * Use for horizontal spacing, padding, font sizes
 */
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / guidelineBaseWidth) * size;
};

/**
 * Scale a value based on screen height
 * Use for vertical spacing, margins
 */
export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / guidelineBaseHeight) * size;
};

/**
 * Moderate scaling - scale with a factor (default 0.5)
 * More balanced scaling that doesn't make things too big/small
 * Use for most UI elements
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

/**
 * Moderate vertical scaling
 */
export const moderateVerticalScale = (size: number, factor: number = 0.5): number => {
  return size + (verticalScale(size) - size) * factor;
};

/**
 * Get responsive font size
 * Scales fonts appropriately for different screen sizes
 */
export const responsiveFontSize = (size: number): number => {
  const newSize = moderateScale(size, 0.3);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

/**
 * Check if the device is a small screen phone
 * Typically less than 375px width
 */
export const isSmallDevice = (): boolean => {
  return SCREEN_WIDTH < 375;
};

/**
 * Check if the device is a large screen (tablet-like)
 */
export const isLargeDevice = (): boolean => {
  return SCREEN_WIDTH >= 768;
};

/**
 * Get device screen width
 */
export const screenWidth = SCREEN_WIDTH;

/**
 * Get device screen height
 */
export const screenHeight = SCREEN_HEIGHT;

/**
 * Get the width percentage of screen
 */
export const widthPercentage = (percentage: number): number => {
  return (percentage / 100) * SCREEN_WIDTH;
};

/**
 * Get the height percentage of screen
 */
export const heightPercentage = (percentage: number): number => {
  return (percentage / 100) * SCREEN_HEIGHT;
};

/**
 * Normalize size for different screen densities
 */
export const normalize = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export default {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  responsiveFontSize,
  isSmallDevice,
  isLargeDevice,
  screenWidth,
  screenHeight,
  widthPercentage,
  heightPercentage,
  normalize,
};
