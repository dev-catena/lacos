import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import groupService from '../../services/groupService';

const CreateGroupScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [groupPhoto, setGroupPhoto] = useState(null);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar suas fotos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setGroupPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const removeImage = () => {
    setGroupPhoto(null);
  };

  const handleCreateGroup = async () => {
    // Validação
    if (!groupName.trim()) {
      Alert.alert('Atenção', 'Por favor, informe o nome do grupo');
      return;
    }

    try {
      setLoading(true);

      // Preparar dados para envio
      const formData = new FormData();
      formData.append('name', groupName.trim());
      
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      // Adicionar foto se selecionada
      if (groupPhoto) {
        const filename = groupPhoto.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('photo', {
          uri: groupPhoto,
          name: filename,
          type: type,
        });
      }

      console.log('📤 Criando grupo:', groupName);
      const result = await groupService.createGroup(formData);

      if (result.success) {
        const newGroup = result.data;
        
        Toast.show({
          type: 'success',
          text1: 'Grupo Criado!',
          text2: `${groupName} foi criado com sucesso`,
        });

        // Mostrar o código de convite
        if (newGroup.code) {
          Alert.alert(
            '✅ Grupo Criado!',
            `Compartilhe este código com os membros:\n\n${newGroup.code}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navegar para a home
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'HomeMain' }],
                  });
                },
              },
            ]
          );
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'HomeMain' }],
          });
        }
      } else {
        Alert.alert('Erro', result.error || 'Não foi possível criar o grupo');
      }
    } catch (error) {
      console.error('❌ Erro ao criar grupo:', error);
      Alert.alert('Erro', 'Não foi possível criar o grupo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Criar Novo Grupo</Text>
          <Text style={styles.headerSubtitle}>Preencha as informações básicas</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Foto do Grupo */}
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Foto do Grupo (Opcional)</Text>
            
            {groupPhoto ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: groupPhoto }} style={styles.groupImage} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={removeImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={32} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="camera" size={48} color={colors.primary} />
                <Text style={styles.addPhotoText}>Adicionar Foto</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Nome do Grupo */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Nome do Grupo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Cuidados Vovó Maria"
              placeholderTextColor={colors.gray400}
              value={groupName}
              onChangeText={setGroupName}
              autoCapitalize="words"
            />
          </View>

          {/* Descrição */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Descrição (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Adicione uma descrição sobre este grupo de cuidados"
              placeholderTextColor={colors.gray400}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Informativo */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Próximos Passos</Text>
              <Text style={styles.infoText}>
                Após criar o grupo, você poderá:
                {'\n'}• Adicionar dados do paciente nas Configurações
                {'\n'}• Convidar outros cuidadores
                {'\n'}• Configurar contatos de emergência
                {'\n'}• Gerenciar medicamentos e consultas
              </Text>
            </View>
          </View>

          {/* Botão Criar */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateGroup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.textWhite} />
            ) : (
              <>
                <Ionicons name="add-circle" size={24} color={colors.textWhite} />
                <Text style={styles.createButtonText}>Criar Grupo</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  content: {
    padding: 20,
  },
  photoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  groupImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.gray200,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
  },
  addPhotoButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.info + '20',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 32,
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
});

export default CreateGroupScreen;
