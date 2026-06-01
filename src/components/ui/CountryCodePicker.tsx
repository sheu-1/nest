import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text } from './Typography';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { CountryPicker } from 'react-native-country-codes-picker';

export interface Country {
  dial_code: string;
  flag: string;
}

interface Props {
  selectedCode: string;
  onSelect: (country: Country) => void;
  containerStyle?: any;
}

export const CountryCodePicker: React.FC<Props> = ({ selectedCode, onSelect, containerStyle }) => {
  const [show, setShow] = useState(false);
  const [currentFlag, setCurrentFlag] = useState('🇰🇪');

  return (
    <>
      <TouchableOpacity
        style={[styles.pickerButton, containerStyle]}
        onPress={() => setShow(true)}
      >
        <Text style={styles.flag}>{currentFlag}</Text>
        <Text style={styles.dialCode}>{selectedCode}</Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.secondaryText} />
      </TouchableOpacity>

      <CountryPicker
        show={show}
        pickerButtonOnPress={(item) => {
          setCurrentFlag(item.flag);
          onSelect({ dial_code: item.dial_code, flag: item.flag });
          setShow(false);
        }}
        onBackdropPress={() => setShow(false)}
        style={{
          modal: { height: 500 },
          textInput: {
            paddingLeft: 15,
            paddingRight: 15,
            height: 48,
          },
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 52,
    marginRight: SPACING.sm,
  },
  flag: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  dialCode: {
    fontSize: 16,
    color: COLORS.text,
    marginRight: SPACING.xs,
  },
});
