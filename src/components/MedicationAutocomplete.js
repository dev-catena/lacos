import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import SafeIcon from './SafeIcon';

const MedicationAutocomplete = ({
  value,
  onChangeText,
  onSelect,
  suggestions = [],
  placeholder = "Ex: Losartana",
  isLoading = false,
  style,
  showPrice = false,
  price = null,
  isFarmaciaPopular = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const isSelectingRef = useRef(false);

  // Garantir que value seja sempre uma string
  const safeValue = value || '';

  // Mostrar sugestões quando houver resultados e o input estiver focado
  useEffect(() => {
    if (isFocused && suggestions.length > 0 && safeValue.length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [suggestions, isFocused, safeValue]);

  const handleFocus = () => {
    setIsFocused(true);
    if (safeValue.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Só fechar se não estiver selecionando
    if (!isSelectingRef.current) {
      setTimeout(() => {
        setIsFocused(false);
        setShowSuggestions(false);
      }, 400);
    }
  };

  const handleTextChange = (text) => {
    console.log('🔍 MedicationAutocomplete - handleTextChange chamado com:', text);
    if (onChangeText) {
      onChangeText(text);
    }
  };

  const handleSelect = (item) => {
    // Usar displayName (apenas nome) se disponível, senão usar name
    // Isso garante que apenas o nome seja salvo, sem concentração
    const medicationName = item.displayName || item.name;
    
    // Marcar que estamos selecionando
    isSelectingRef.current = true;
    
    // Fechar sugestões imediatamente
    setShowSuggestions(false);
    setIsFocused(false);
    
    // Atualizar o texto imediatamente
    if (onChangeText) {
      onChangeText(medicationName);
    }
    
    // Chamar callback de seleção (passar item atualizado com nome limpo)
    if (onSelect) {
      onSelect({
        ...item,
        name: medicationName, // Atualizar name para o nome limpo
      });
    }
    
    // Garantir que o valor seja mantido mesmo após onBlur
    setTimeout(() => {
      if (onChangeText) {
        onChangeText(medicationName);
      }
      setTimeout(() => {
        if (onChangeText) {
          onChangeText(medicationName);
        }
        // Resetar flag após garantir que o valor foi aplicado
        setTimeout(() => {
          isSelectingRef.current = false;
        }, 200);
      }, 100);
    }, 50);
  };

  return (
    <View ref={containerRef} style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[styles.input, safeValue && !isLoading && !showSuggestions && styles.inputFilled]}
          placeholder={placeholder}
          value={safeValue}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isLoading && (
          <View style={styles.indicator}>
            <SafeIcon name="search" size={16} color={colors.textLight} />
          </View>
        )}
        {safeValue && !isLoading && !showSuggestions && (
          <View style={styles.indicator}>
            <SafeIcon name="checkmark-circle" size={20} color={colors.primary} />
          </View>
        )}
      </View>
      
      {isFarmaciaPopular && (
        <View style={styles.farmaciaPopularBadge}>
          <SafeIcon name="checkmark-circle" size={18} color={colors.success || '#10b981'} />
          <Text style={styles.farmaciaPopularText}>Disponível na Farmácia Popular</Text>
        </View>
      )}
      
      {showPrice && price && (
        <View style={styles.priceContainer}>
          <SafeIcon name="cash-outline" size={16} color={colors.textLight} />
          <Text style={styles.priceLabel}>Preço de referência:</Text>
          <Text style={styles.priceValue}>R$ {price.toFixed(2).replace('.', ',')}</Text>
        </View>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item, index) => (
            <Pressable
              key={`med-${index}-${item.name}`}
              style={({ pressed }) => [
                styles.suggestionItem,
                pressed && styles.suggestionItemPressed
              ]}
              onTouchStart={() => {
                // Marcar flag e definir valor ANTES do onBlur ser disparado
                isSelectingRef.current = true;
                // Usar displayName (apenas nome) se disponível, senão usar name
                const medicationName = item.displayName || item.name;
                
                // Fechar sugestões imediatamente
                setShowSuggestions(false);
                setIsFocused(false);
                
                // Atualizar o valor imediatamente
                if (onChangeText) {
                  onChangeText(medicationName);
                }
                
                // Chamar callback (passar item atualizado com nome limpo)
                if (onSelect) {
                  onSelect({
                    ...item,
                    name: medicationName, // Atualizar name para o nome limpo
                  });
                }
                
                // Garantir que o valor seja mantido após onBlur
                setTimeout(() => {
                  if (onChangeText) {
                    onChangeText(medicationName);
                  }
                  setTimeout(() => {
                    if (onChangeText) {
                      onChangeText(medicationName);
                    }
                    isSelectingRef.current = false;
                  }, 200);
                }, 100);
              }}
              onPress={() => {
                // Apenas garantir que o valor está correto
                if (onChangeText && !isSelectingRef.current) {
                  const medicationName = item.displayName || item.name;
                  onChangeText(medicationName);
                }
              }}
            >
              <View style={styles.suggestionIconContainer}>
                <SafeIcon name="medical" size={20} color={colors.primary} />
              </View>
              <Text style={styles.suggestionText}>{item.displayName || item.name}</Text>
              <SafeIcon 
                name="checkmark-circle-outline" 
                size={20} 
                color={colors.primary} 
                style={styles.suggestionCheckIcon} 
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 9998,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  inputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  indicator: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    maxHeight: 200,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 9999,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  suggestionItemPressed: {
    backgroundColor: colors.primary + '10',
  },
  suggestionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  suggestionCheckIcon: {
    marginLeft: 8,
    opacity: 0.6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 10,
    backgroundColor: colors.primary + '08',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 6,
    marginRight: 4,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  farmaciaPopularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 10,
    backgroundColor: '#10b981' + '15',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  farmaciaPopularText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 6,
    fontWeight: '600',
  },
});

export default MedicationAutocomplete;

