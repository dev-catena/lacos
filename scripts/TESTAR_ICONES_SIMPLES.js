// Teste simples para verificar se os ícones estão funcionando
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TesteIcones() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teste de Ícones</Text>
      <View style={styles.iconRow}>
        <Ionicons name="home" size={32} color="#000000" />
        <Text>Home</Text>
      </View>
      <View style={styles.iconRow}>
        <Ionicons name="person" size={32} color="#000000" />
        <Text>Person</Text>
      </View>
      <View style={styles.iconRow}>
        <Ionicons name="medical" size={32} color="#000000" />
        <Text>Medical</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
  },
});
