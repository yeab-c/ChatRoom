import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent } from 'react-native';

export const useKeyboard = () => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    const hideSubscription = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleKeyboardShow = (event: KeyboardEvent) => {
    setKeyboardVisible(true);
    setKeyboardHeight(event.endCoordinates.height);
  };

  const handleKeyboardHide = () => {
    setKeyboardVisible(false);
    setKeyboardHeight(0);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return {
    keyboardVisible,
    keyboardHeight,
    dismissKeyboard,
  };
};