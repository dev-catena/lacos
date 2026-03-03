import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SafeIcon from '../../components/SafeIcon';
import Toast from 'react-native-toast-message';
import colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/userService';

// Função para converter data de AAAA-MM-DD para DD/MM/AAAA
const formatDateFromBackend = (dateString) => {
  if (!dateString) return '';
  // Se já estiver no formato DD/MM/AAAA, retornar como está
  if (dateString.includes('/')) return dateString;
  // Converter de AAAA-MM-DD para DD/MM/AAAA
  const dateParts = dateString.split('-');
  if (dateParts.length === 3) {
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  }
  return dateString;
};

// Função para aplicar máscara de telefone (+55 (XX) XXXXX-XXXX ou +55 (XX) XXXXX-XXXXX)
const formatPhone = (value) => {
  // Se value for string vazia ou apenas espaços, retornar +55
  if (!value || value.toString().trim() === '') {
    return '+55';
  }
  
  // Remove tudo que não é número
  const numbers = value.toString().replace(/\D/g, '');
  
  // Se não houver números, retornar +55
  if (numbers.length === 0) {
    return '+55';
  }
  
  // Se começar com 55, remover (já está no prefixo +55)
  let cleanNumbers = numbers.startsWith('55') ? numbers.slice(2) : numbers;
  
  // Limita a 12 dígitos (DDD + número com até 10 dígitos)
  if (cleanNumbers.length > 12) {
    cleanNumbers = cleanNumbers.slice(0, 12);
  }
  
  // Aplica a máscara
  if (cleanNumbers.length === 0) {
    return '+55';
  } else if (cleanNumbers.length <= 2) {
    return `+55 (${cleanNumbers}`;
  } else if (cleanNumbers.length <= 7) {
    return `+55 (${cleanNumbers.slice(0, 2)}) ${cleanNumbers.slice(2)}`;
  } else if (cleanNumbers.length <= 11) {
    return `+55 (${cleanNumbers.slice(0, 2)}) ${cleanNumbers.slice(2, 7)}-${cleanNumbers.slice(7, 11)}`;
  } else {
    // Para 12 dígitos: +55 (XX) XXXXX-XXXXX
    return `+55 (${cleanNumbers.slice(0, 2)}) ${cleanNumbers.slice(2, 7)}-${cleanNumbers.slice(7, 12)}`;
  }
};

// Função para formatar CPF do backend (aplica máscara 000.000.000-00)
const formatCPFFromBackend = (cpfString) => {
  if (!cpfString) return '';
  const numbers = cpfString.toString().replace(/\D/g, '');
  if (numbers.length === 0) return '';
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

// Função para validar CPF (dígitos verificadores e regras)
const validateCPF = (cpf) => {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return false;
  // Rejeitar CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(numbers[9])) return false;
  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(numbers[10])) return false;
  return true;
};

// Função para formatar telefone do backend (remove +55 se existir)
const formatPhoneFromBackend = (phoneString) => {
  if (!phoneString) return '+55';
  // Se já tiver +55, manter como está
  if (phoneString.startsWith('+55')) return phoneString;
  // Se tiver apenas números, adicionar +55 e formatar
  const numbers = phoneString.replace(/\D/g, '');
  if (numbers.length === 0) return '+55';
  return formatPhone(numbers);
};

const EditPersonalDataScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();

  // Converter gênero de inglês para português ao carregar
  const genderMapFromEnglish = {
    'male': 'Masculino',
    'female': 'Feminino',
    'masculino': 'Masculino',
    'feminino': 'Feminino',
    'outro': 'Outro',
    'other': 'Outro',
  };

  const [formData, setFormData] = useState({
    name: user?.name || '',
    lastName: user?.lastName || user?.last_name || '',
    email: user?.email || '',
    phone: formatPhoneFromBackend(user?.phone || ''),
    cpf: formatCPFFromBackend(user?.cpf || ''),
    birthDate: formatDateFromBackend(user?.birthDate || user?.birth_date || ''),
    gender: user?.gender ? (genderMapFromEnglish[user.gender] || user.gender) : '',
    address: user?.address || '',
    addressNumber: user?.address_number || user?.addressNumber || '',
    addressComplement: user?.address_complement || user?.addressComplement || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || user?.zip_code || '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [cpfError, setCpfError] = useState('');
  const cepTimeoutRef = useRef(null);

  const isProfessionalCaregiver = user?.profile === 'professional_caregiver';

  // Sincronizar formData quando user mudar (ex: ao voltar de outra tela)
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        lastName: user.lastName || user.last_name || prev.lastName,
        email: user.email || prev.email,
        phone: formatPhoneFromBackend(user.phone || '') || prev.phone,
        cpf: formatCPFFromBackend(user.cpf || '') || prev.cpf,
        birthDate: formatDateFromBackend(user.birthDate || user.birth_date || '') || prev.birthDate,
        gender: user.gender ? (genderMapFromEnglish[user.gender] || user.gender) : prev.gender,
        address: user.address || prev.address,
        addressNumber: user.address_number || user.addressNumber || prev.addressNumber,
        addressComplement: user.address_complement || user.addressComplement || prev.addressComplement,
        city: user.city || prev.city,
        state: user.state || prev.state,
        zipCode: user.zipCode || user.zip_code || prev.zipCode,
      }));
    }
  }, [user]);

  const handleSave = async () => {
    setCpfError('');

    // Validações básicas
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Erro', 'E-mail é obrigatório');
      return;
    }

    // Validação CPF para cuidador profissional
    if (isProfessionalCaregiver) {
      const cleanCPF = formData.cpf?.replace(/\D/g, '') || '';
      if (!cleanCPF || cleanCPF.length < 11) {
        setCpfError('CPF é obrigatório para cuidador profissional');
        Alert.alert('Atenção', 'CPF é obrigatório para cuidador profissional');
        return;
      }
      if (!validateCPF(formData.cpf)) {
        setCpfError('CPF inválido. Verifique os números digitados.');
        Alert.alert('CPF inválido', 'O CPF informado não é válido. Verifique os números digitados.');
        return;
      }
    } else if (formData.cpf?.trim()) {
      // Para outros perfis: se CPF preenchido, validar
      const cleanCPF = formData.cpf.replace(/\D/g, '');
      if (cleanCPF.length === 11 && !validateCPF(formData.cpf)) {
        setCpfError('CPF inválido. Verifique os números digitados.');
        Alert.alert('CPF inválido', 'O CPF informado não é válido. Verifique os números digitados.');
        return;
      }
    }

    setLoading(true);

    try {
      console.log('💾 Salvando dados do usuário...');
      
      // Preparar dados para envio (usar snake_case para o backend)
      const dataToUpdate = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };

      // Adicionar sobrenome se preenchido
      if (formData.lastName && formData.lastName.trim()) {
        dataToUpdate.last_name = formData.lastName.trim();
      }

      // Adicionar campos opcionais apenas se preenchidos
      if (formData.phone && formData.phone !== '+55') {
        // Remover +55 e formatação, manter apenas números
        const phoneNumbers = formData.phone.replace(/\D/g, '');
        // Se começar com 55, manter; senão, adicionar 55
        dataToUpdate.phone = phoneNumbers.startsWith('55') ? phoneNumbers : `55${phoneNumbers}`;
      }
      if (formData.cpf && formData.cpf.trim()) {
        const cleanCPF = formData.cpf.replace(/\D/g, '');
        if (cleanCPF.length === 11 && validateCPF(formData.cpf)) {
          dataToUpdate.cpf = cleanCPF;
        } else if (cleanCPF.length === 11) {
          dataToUpdate.cpf = cleanCPF;
        }
      }
      if (formData.birthDate) {
        // Converter data de DD/MM/AAAA para AAAA-MM-DD (formato do banco)
        const dateParts = formData.birthDate.split('/');
        if (dateParts.length === 3) {
          const [day, month, year] = dateParts;
          dataToUpdate.birth_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else {
          // Se não estiver no formato correto, enviar como está
          dataToUpdate.birth_date = formData.birthDate;
        }
      }
      if (formData.gender) {
        const genderMap = {
          'Masculino': 'masculino',
          'Feminino': 'feminino',
          'Outro': 'outro',
          'male': 'masculino',
          'female': 'feminino',
          'other': 'outro',
        };
        dataToUpdate.gender = genderMap[formData.gender] || formData.gender?.toLowerCase() || formData.gender;
      }
      if (formData.address && formData.address.trim()) {
        dataToUpdate.address = formData.address.trim();
      }
      if (formData.addressNumber) dataToUpdate.address_number = formData.addressNumber;
      if (formData.addressComplement) dataToUpdate.address_complement = formData.addressComplement;
      if (formData.city) dataToUpdate.city = formData.city;
      if (formData.state) dataToUpdate.state = formData.state;
      if (formData.zipCode) dataToUpdate.zip_code = formData.zipCode;

      // Enviar para API
      const response = await userService.updateUserData(user.id, dataToUpdate);
      
      console.log('📥 Resposta da API:', response);

      if (response.success && response.data) {
        // Atualizar contexto com novos dados
        if (updateUser) {
          updateUser(response.data);
        }
        
        Toast.show({
          type: 'success',
          text1: '✅ Dados atualizados',
          text2: 'Suas informações foram salvas com sucesso',
          position: 'bottom',
        });

        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      } else {
        throw new Error(response.error || 'Erro ao atualizar dados');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
      Alert.alert('Erro', error.message || 'Não foi possível atualizar os dados');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Função para aplicar máscara de data (DD/MM/AAAA)
  const formatDate = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  // Função para lidar com mudança na data
  const handleDateChange = (value) => {
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 8 dígitos (DDMMAAAA)
    if (numbers.length <= 8) {
      const formatted = formatDate(numbers);
      updateField('birthDate', formatted);
    }
  };


  // Função para lidar com mudança no telefone
  const handlePhoneChange = (text) => {
    // Se o campo estiver vazio ou só tiver +, definir como +55
    if (!text || text.trim() === '' || text === '+') {
      updateField('phone', '+55');
      return;
    }
    
    // Extrair apenas os números do valor digitado
    const numbers = text.replace(/\D/g, '');
    
    // Se não houver números após extrair, manter apenas +55
    if (numbers.length === 0) {
      updateField('phone', '+55');
      return;
    }
    
    // Se começar com 55, remover (já está no prefixo +55)
    let cleanNumbers = numbers.startsWith('55') ? numbers.slice(2) : numbers;
    
    // Limita a 12 dígitos (DDD + número com até 10 dígitos)
    if (cleanNumbers.length > 12) {
      cleanNumbers = cleanNumbers.slice(0, 12);
    }
    
    // Aplicar formatação
    const formatted = formatPhone(cleanNumbers);
    updateField('phone', formatted);
  };

  // Função para lidar com foco no campo de telefone
  const handlePhoneFocus = () => {
    // Se o campo estiver vazio ou só tiver +55, manter editável
    // O campo já é editável por padrão, mas garantimos que funcione
    if (!formData.phone || formData.phone === '+55') {
      // Manter +55 mas permitir edição
      return;
    }
  };

  // Função para aplicar máscara de CPF (000.000.000-00)
  const formatCPF = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica a máscara
    if (limitedNumbers.length === 0) {
      return '';
    } else if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3)}`;
    } else if (limitedNumbers.length <= 9) {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3, 6)}.${limitedNumbers.slice(6)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3, 6)}.${limitedNumbers.slice(6, 9)}-${limitedNumbers.slice(9, 11)}`;
    }
  };

  // Função para lidar com mudança no CPF
  const handleCPFChange = (text) => {
    setCpfError('');
    const formatted = formatCPF(text);
    updateField('cpf', formatted);
  };

  const handleCPFBlur = () => {
    if (formData.cpf?.trim()) {
      const cleanCPF = formData.cpf.replace(/\D/g, '');
      if (cleanCPF.length === 11 && !validateCPF(formData.cpf)) {
        setCpfError('CPF inválido');
      } else {
        setCpfError('');
      }
    } else if (isProfessionalCaregiver) {
      setCpfError('CPF é obrigatório');
    } else {
      setCpfError('');
    }
  };

  // Função para buscar CEP usando ViaCEP
  const searchCEP = async (cep) => {
    // Remove formatação do CEP
    const cleanCEP = cep.replace(/\D/g, '');
    
    // Verifica se tem 8 dígitos
    if (cleanCEP.length !== 8) {
      return;
    }
    
    try {
      setLoadingCEP(true);
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        Toast.show({
          type: 'error',
          text1: 'CEP não encontrado',
          text2: 'Verifique o CEP digitado',
        });
        return;
      }
      
      // Preencher campos com os dados do CEP
      if (data.logradouro) {
        updateField('address', data.logradouro);
      }
      if (data.bairro) {
        // Não temos campo bairro separado, mas podemos adicionar ao endereço se necessário
      }
      if (data.localidade) {
        updateField('city', data.localidade);
      }
      if (data.uf) {
        updateField('state', data.uf);
      }
      
      Toast.show({
        type: 'success',
        text1: 'CEP encontrado',
        text2: 'Endereço preenchido automaticamente',
      });
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao buscar CEP',
        text2: 'Tente novamente mais tarde',
      });
    } finally {
      setLoadingCEP(false);
    }
  };

  // Função para aplicar máscara de CEP (00000-000)
  const formatCEP = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 8 dígitos
    const limitedNumbers = numbers.slice(0, 8);
    
    // Aplica a máscara
    if (limitedNumbers.length <= 5) {
      return limitedNumbers;
    } else {
      return `${limitedNumbers.slice(0, 5)}-${limitedNumbers.slice(5, 8)}`;
    }
  };

  // Função para lidar com mudança no CEP
  const handleCEPChange = (text) => {
    const formatted = formatCEP(text);
    updateField('zipCode', formatted);
    
    // Limpar timeout anterior se existir
    if (cepTimeoutRef.current) {
      clearTimeout(cepTimeoutRef.current);
    }
    
    // Buscar CEP quando tiver 8 dígitos
    const cleanCEP = formatted.replace(/\D/g, '');
    if (cleanCEP.length === 8 && !loadingCEP) {
      // Usar setTimeout para dar tempo do usuário terminar de digitar
      cepTimeoutRef.current = setTimeout(() => {
        searchCEP(cleanCEP);
      }, 800);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <SafeIcon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Dados Pessoais</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Informações Básicas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Básicas</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome *</Text>
              <View style={styles.inputWrapper}>
                <SafeIcon name="person-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Sobrenome</Text>
              <View style={styles.inputWrapper}>
                <SafeIcon name="person-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu sobrenome"
                  value={formData.lastName}
                  onChangeText={(value) => updateField('lastName', value)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail *</Text>
              <View style={styles.inputWrapper}>
                <SafeIcon name="mail-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefone</Text>
              <View style={styles.inputWrapper}>
                <SafeIcon name="call-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="+55 (11) 99999-9999"
                  value={formData.phone}
                  onChangeText={handlePhoneChange}
                  onFocus={handlePhoneFocus}
                  keyboardType="phone-pad"
                  maxLength={19}
                  editable={true}
                  selectTextOnFocus={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                CPF {isProfessionalCaregiver && '*'}
              </Text>
              {isProfessionalCaregiver && (
                <Text style={styles.labelSubtitle}>
                  Obrigatório para cuidador profissional
                </Text>
              )}
              <View style={[
                styles.inputWrapper,
                cpfError && styles.inputWrapperError,
              ]}>
                <SafeIcon
                  name="card-outline"
                  size={20}
                  color={cpfError ? colors.error : colors.gray400}
                />
                <TextInput
                  style={styles.input}
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChangeText={handleCPFChange}
                  onBlur={handleCPFBlur}
                  keyboardType="number-pad"
                  maxLength={14}
                  placeholderTextColor={colors.placeholder}
                />
              </View>
              {cpfError ? (
                <Text style={styles.errorText}>{cpfError}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Data de Nascimento</Text>
              <View style={styles.inputWrapper}>
                <SafeIcon name="calendar-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  value={formData.birthDate}
                  onChangeText={handleDateChange}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Sexo</Text>
              <View style={styles.genderSelector}>
                {['Masculino', 'Feminino'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderOption,
                      formData.gender === gender && styles.genderOptionActive,
                    ]}
                    onPress={() => updateField('gender', gender)}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        formData.gender === gender && styles.genderOptionTextActive,
                      ]}
                    >
                      {gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Endereço */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endereço</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>CEP</Text>
              <View style={styles.inputWrapper}>
                <SafeIcon name="location-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="00000-000"
                  value={formData.zipCode}
                  onChangeText={handleCEPChange}
                  keyboardType="number-pad"
                  maxLength={9}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Endereço</Text>
              <View style={styles.inputWrapper}>
                <SafeIcon name="home-outline" size={20} color={colors.gray400} />
                <TextInput
                  style={styles.input}
                  placeholder="Rua, Avenida, etc"
                  value={formData.address}
                  onChangeText={(value) => updateField('address', value)}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Número</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    value={formData.addressNumber}
                    onChangeText={(value) => updateField('addressNumber', value)}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, { flex: 2 }]}>
                <Text style={styles.label}>Complemento</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Apto, Bloco, etc"
                    value={formData.addressComplement}
                    onChangeText={(value) => updateField('addressComplement', value)}
                    onFocus={() => {
                      // Se o campo estiver vazio, adicionar "Apto " ao receber foco
                      if (!formData.addressComplement || formData.addressComplement.trim() === '') {
                        updateField('addressComplement', 'Apto ');
                      }
                    }}
                    editable={true}
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 2 }]}>
                <Text style={styles.label}>Cidade</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Cidade"
                    value={formData.city}
                    onChangeText={(value) => updateField('city', value)}
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>UF</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="SP"
                    value={formData.state}
                    onChangeText={(value) => updateField('state', value)}
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Botão Salvar */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <SafeIcon name="checkmark-circle" size={24} color={colors.textWhite} />
            <Text style={styles.saveButtonText}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    minHeight: 52,
    gap: 12,
  },
  inputWrapperError: {
    borderColor: colors.error,
    backgroundColor: colors.error + '08',
  },
  labelSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  genderSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  genderOptionActive: {
    borderColor: colors.success,
    backgroundColor: colors.success + '20',
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  genderOptionTextActive: {
    color: colors.success,
  },
});

export default EditPersonalDataScreen;

