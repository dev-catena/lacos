import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../user_profile/presentation/widgets/screens/group_selection_screen.dart';
import '../../domain/entities/patient.dart';
import '../../domain/entities/user.dart';
import '../models/user_model.dart';

class UserDataSource {
  Future<List<Patient>> getPatientsForUser(int id) async {
    final rawData = _MockData().patientsForUser;
    final List<Patient> convertedData = [];

    for (final ele in rawData) {
      convertedData.add(Patient.fromJson(ele));
    }

    return convertedData;
  }

  Future<UserEntity> login(GoogleSignInAccount account) async {
    final UserEntity user = UserModel.fromJson(_MockData().user).copyWith(googleAccount: account);
    return user;
  }

  Future<int?> getDefaultPatient() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();

    final int? patientId = prefs.getInt('paciente-selecionado');

    return patientId;
  }

  Future<void> setDefaultPatient(int id) async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();

    prefs.setInt('paciente-selecionado', id);
  }

  Future<void> clearDefaultPatient() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();

    prefs.remove('paciente-selecionado');
  }

  Future<AccessProfileType> getAccessType(UserEntity user) async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();

    final int? accessTypeId = prefs.getInt('perfil-acesso');

    if (accessTypeId == null) {
      await prefs.setInt('perfil-acesso', user.accessProfileTypes.first.code);
      return AccessProfileType.fromCode(user.accessProfileTypes.first.code);
    }

    return AccessProfileType.fromCode(accessTypeId);
  }

  Future<void> setDefaultAccessType(AccessProfileType accessType) async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setInt('perfil-acesso', accessType.code);
  }
}

enum GroupStatus {
  pending(1, 'Pendente'),
  accepted(2, 'Aceito');

  final int code;
  final String description;

  factory GroupStatus.fromCode(int number) {
    switch (number) {
      case 1:
        return GroupStatus.pending;
      case 2:
        return GroupStatus.accepted;
      default:
        throw Exception('Status não reconhecido, status: $number');
    }
  }

  const GroupStatus(this.code, this.description);
}

class _MockData {
  final List<Map<String, dynamic>> patientsForUser = [
    {
      'paciente': {
        'id': 1,
        'nomeCompleto': 'Geralda Maria das Graças',
        'paciente': 1,
        'caminhoFoto': 'assets/images/senhora.webp',
        'perfisAcesso': [1],
      },
      'medicacoes': [],
      'cuidadores': [],
      'codigo': 'OPI WGH',
      'status': 1,
    },
    {
      'paciente': {
        'id': 2,
        'nomeCompleto': 'Antônio dos Santos',
        'paciente': 1,
        'caminhoFoto': 'assets/images/senhora.webp',
        'perfisAcesso': [1],
      },
      'codigo': 'BNJ LCL',
      'status': 2,
      'medicacoes': [
        {
          'medicamento': {
            'id': 1,
            'nome': 'Paracetamol',
            'tipo': 1,
            'descricao': 'Analgésico e antitérmico',
            'dosagem': '500.0',
          },
          'updated_at': '2025-04-20T10:00:00',
          'instrucoes': <int>[],
          'foi_tomado': 0,
          'primeira_dose': '07:00',
          'frequencia': 8,
          'dosagem': 50.0,
          'status': 1,
        },
        {
          'medicamento': {
            'id': 2,
            'nome': 'Xarope para Tosse',
            'tipo': 3,
            'descricao': 'Alivia a tosse e descongestiona',
            'dosagem': '10.0',
          },
          'updated_at': '2025-04-20T10:00:00',
          'instrucoes': <int>[1],
          'foi_tomado': 0,
          'primeira_dose': '08:00',
          'frequencia': 8,
          'dosagem': 10.0,
          'status': 1,
        },
        {
          'medicamento': {
            'id': 3,
            'nome': 'Xarope',
            'tipo': 3,
            'descricao': 'Alivia a tosse',
            'dosagem': '10.0',
          },
          'updated_at': '2025-04-20T10:00:00',
          'instrucoes': <int>[2, 3],
          'foi_tomado': 0,
          'primeira_dose': '06:00',
          'frequencia': 6,
          'dosagem': 10.0,
          'status': 2,
        },
        {
          'medicamento': {
            'id': 4,
            'nome': 'Pomada Anti-inflamatória',
            'tipo': 2,
            'descricao': 'Reduz a inflamação e alivia a dor nas articulações',
            'dosagem': '2.0',
          },
          'updated_at': '2025-04-20T10:00:00',
          'instrucoes': <int>[],
          'foi_tomado': 0,
          'primeira_dose': '09:00',
          'frequencia': 12,
          'dosagem': 1.0,
          'status': 3,
        },
        {
          'medicamento': {
            'id': 5,
            'nome': 'Vitamina C',
            'tipo': 1,
            'descricao': 'Fortalece o sistema imunológico',
            'dosagem': '1000.0',
          },
          'updated_at': '2025-04-20T10:00:00',
          'instrucoes': <int>[],
          'foi_tomado': 0,
          'primeira_dose': '08:00',
          'frequencia': 4,
          'dosagem': 3.0,
          'status': 1,
        },
        {
          'medicamento': {
            'id': 6,
            'nome': 'Insulina',
            'tipo': 5,
            'descricao': 'Controle de níveis de glicose no sangue',
            'dosagem': '10.0',
          },
          'updated_at': '2025-04-20T10:00:00',
          'instrucoes': <int>[2],
          'foi_tomado': 0,
          'primeira_dose': '07:00',
          'frequencia': 8,
          'dosagem': 5.0,
          'status': 2,
        },
      ],
      'cuidadores': [
        {
          'id': 3,
          'nomeCompleto': 'Artur Dias',
          'paciente': 0,
          'caminhoFoto': 'https://thispersondoesnotexist.com',
          'perfisAcesso': [2],
        },
      ],
    },
  ];

  final user = {
    'id': 3,
    'nomeCompleto': 'Artur Dias',
    'paciente': 0,
    'caminhoFoto': 'https://thispersondoesnotexist.com',
    'perfisAcesso': [2],
  };
}
