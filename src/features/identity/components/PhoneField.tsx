import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { colors } from '@/theme';

import type { Country } from '../lib/countries';
import { DEFAULT_COUNTRY_ISO2, findCountry, flagOf } from '../lib/countries';

import { CountryPickerSheet } from './CountryPickerSheet';

type PhoneFieldProps = {
  /** E.164 (`+923001234567`), or empty before anything is typed. */
  value: string;
  onChange: (e164: string) => void;
  onBlur?: (() => void) | undefined;
  error?: string | undefined;
  /** So a blocker elsewhere on the screen can put the cursor in here. */
  inputRef?: RefObject<TextInput | null> | undefined;
};

const digitsOnly = (text: string) => text.replace(/\D/g, '');

/**
 * `3001234567` reads as `300 1234567` while it is being typed.
 *
 * Display only — `onChange` still emits plain E.164, so the schema and the API
 * see exactly what they did before. A long run of digits is hard to check
 * against the number in your head, which is the one moment this field has to
 * get right.
 */
const grouped = (national: string) =>
  national.length > 3 ? `${national.slice(0, 3)} ${national.slice(3)}` : national;

/**
 * Country is picked, never typed: a dial code the user has to remember is the
 * one part of a phone number they most often get wrong. The field still emits
 * plain E.164, so the schema and the API see exactly what they did before.
 */
export function PhoneField({ value, onChange, onBlur, error, inputRef }: PhoneFieldProps) {
  const { t } = useTranslation();

  const [iso2, setIso2] = useState(DEFAULT_COUNTRY_ISO2);
  const [pickerOpen, setPickerOpen] = useState(false);

  const country = findCountry(iso2) ?? findCountry(DEFAULT_COUNTRY_ISO2);
  const prefix = country ? `+${country.dial}` : '';

  // Derived, not stored: one source of truth for what the form holds.
  const national = value.startsWith(prefix) ? value.slice(prefix.length) : '';

  const selectCountry = (next: Country) => {
    setIso2(next.iso2);
    setPickerOpen(false);
    onChange(`+${next.dial}${national}`);
  };

  return (
    <View className="gap-1.5">
      <Text variant="label" className="text-gray-700">
        {t('identity.phoneLabel')}
      </Text>

      <View
        className={cn(
          'flex-row items-center rounded-xl border bg-white',
          error ? 'border-error-500' : 'border-gray-200',
        )}
      >
        <Pressable
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('identity.country.change')}
          className="flex-row items-center py-3 pl-4 pr-3 active:opacity-60"
        >
          <Text variant="body">{country ? flagOf(country.iso2) : ''}</Text>
          <Text variant="body" className="ml-2 text-gray-900">
            {prefix}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.gray[400]} className="ml-1" />
        </Pressable>

        <View className="h-6 w-px bg-gray-200" />

        <TextInput
          ref={inputRef}
          accessibilityLabel={t('identity.phoneLabel')}
          placeholder={t('identity.phonePlaceholder')}
          placeholderTextColor={colors.gray[400]}
          value={grouped(national)}
          onChangeText={(text) => onChange(`${prefix}${digitsOnly(text)}`)}
          onBlur={onBlur}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          className="flex-1 px-3 py-3 text-base text-gray-900"
        />
      </View>

      {error ? (
        <Text variant="caption" className="text-error-500" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <CountryPickerSheet
        visible={pickerOpen}
        selectedIso2={iso2}
        onSelect={selectCountry}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}
