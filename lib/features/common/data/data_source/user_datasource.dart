import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../home/domain/entities/patient_event.dart';
import '../../../medication/domain/entities/medication.dart';
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

class Patient {
  final UserEntity self;
  final List<UserEntity> usersForPatient;
  final List<Medication> medications;
  final String groupCode;
  final GroupStatus status;

  Patient({
    required this.self,
    required this.usersForPatient,
    required this.medications,
    required this.groupCode,
    required this.status,
  });

  Patient.fromJson(Map<String, dynamic> json)
      : this(
          self: UserModel.fromJson(json['paciente']),
          usersForPatient: (json['cuidadores'] as List? ?? []).map((e) => UserModel.fromJson(e)).toList(),
          medications: json['medicacoes'],
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
      'medicacoes': <Medication>[],
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
      'medicacoes': <Medication>[
        Medication(
          medicine: const Medicine(
            name: 'Paracetamol',
            type: MedicineType.pill,
            description: 'Analgésico e antitérmico',
            dosage: 500.0,
          ),
          frequency: MedicineFrequency.every8Hours,
          firstDose: const TimeOfDay(hour: 7, minute: 0),
        ),
        Medication(
          medicine: const Medicine(
            name: 'Xarope para Tosse',
            type: MedicineType.syrup,
            description: 'Alivia a tosse e descongestiona',
            dosage: 10.0,
          ),
          frequency: MedicineFrequency.every6Hours,
          firstDose: const TimeOfDay(hour: 8, minute: 0),
        ),
        Medication(
          medicine: const Medicine(
            name: 'Xarope',
            type: MedicineType.syrup,
            description: 'Alivia a tosse',
            dosage: 10.0,
          ),
          frequency: MedicineFrequency.every6Hours,
          firstDose: const TimeOfDay(hour: 6, minute: 0),
        ),
        Medication(
          medicine: const Medicine(
            name: 'Pomada Anti-inflamatória',
            type: MedicineType.ointment,
            description: 'Reduz a inflamação e alivia a dor nas articulações',
            dosage: 2.0,
          ),
          frequency: MedicineFrequency.every12Hours,
          firstDose: const TimeOfDay(hour: 9, minute: 0),
        ),
        Medication(
          medicine: const Medicine(
            name: 'Vitamina C',
            type: MedicineType.pill,
            description: 'Fortalece o sistema imunológico',
            dosage: 1000.0,
          ),
          frequency: MedicineFrequency.singleDose,
          firstDose: const TimeOfDay(hour: 8, minute: 0),
        ),
        Medication(
          medicine: const Medicine(
            name: 'Insulina',
            type: MedicineType.injection,
            description: 'Controle de níveis de glicose no sangue',
            dosage: 10.0,
          ),
          frequency: MedicineFrequency.every12Hours,
          firstDose: const TimeOfDay(hour: 7, minute: 0),
        ),
      ],
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
