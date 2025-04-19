import 'package:shared_preferences/shared_preferences.dart';

import '../../../home/domain/entities/patient_event.dart';
import '../../../user_profile/presentation/widgets/screens/group_selection_screen.dart';
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

  Future<User> login(String user, String pwd) async {
    return UserModel.fromJson(_MockData().user);
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

  Future<AccessProfileType> getAccessType(User user) async {
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

class Patient {
  final User self;
  final List<User> usersForPatient;
  final String groupCode;
  final GroupStatus status;

  Patient({
    required this.self,
    required this.usersForPatient,
    required this.groupCode,
    required this.status,
  });

  Patient.fromJson(Map<String, dynamic> json)
      : this(
          self: UserModel.fromJson(json['paciente']),
          usersForPatient: (json['cuidadores'] as List? ?? []).map((e) => UserModel.fromJson(e)).toList(),
          groupCode: json['codigo'],
          status: GroupStatus.fromCode(json['status']),
        );

  PatientResumeCard buildResumeCard(List<PatientEvent> events) {
    return PatientResumeCard(this, events: events);
  }

  PatientGroupCard buildGroupCard() {
    return PatientGroupCard(this);
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
  final patientsForUser = [
    {
      'paciente': {
        'id': 1,
        'nomeCompleto': 'Geralda Maria das Graças',
        'paciente': 1,
        'caminhoFoto': 'assets/images/senhora.webp',
        'perfisAcesso': [1],
      },
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
      'cuidadores': [
        {
          'id': 3,
          'nomeCompleto': 'Artur Dias',
          'paciente': 0,
          'caminhoFoto': 'https://thispersondoesnotexist.com',
          'perfisAcesso': [2, 3],
        },
      ],
    },
  ];

  final user = {
    'id': 3,
    'nomeCompleto': 'Artur Dias',
    'paciente': 0,
    'caminhoFoto': 'https://thispersondoesnotexist.com',
    'perfisAcesso': [2, 3],
  };
}
