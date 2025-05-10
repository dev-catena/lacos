import 'dart:math';

import '../../../medication/domain/entities/medication.dart';
import '../../../medication/domain/entities/prescription.dart';
import '../../domain/entities/patient.dart';

class MedicationDataSource {
  Future<List<Prescription>> getPrescriptionForPatient(Patient patient) async {
    final rawData = _MockData().prescriptions;
    final prescriptions = rawData.map((e) => Prescription.fromJson(e)).toList();

    return prescriptions;
  }

  Future<Prescription> registerPrescription(Patient patient, Prescription pres) async {
    // final response = await api.post('endpoint', jsonEncode(pres.toJson()));
    final response = pres.copyWith(id: Random().nextInt(6000) + 1000);

    return response;
  }

  Future<Prescription> deactivatePrescription(Patient patient, Prescription pres) async {
    final response = pres.copyWith(isActive: false);
    final List<Medication> deactivatedMeds = [];

    for (final ele in response.medications) {
      deactivatedMeds.add(ele.copyWith(treatmentStatus: TreatmentStatus.discontinued, lastUpdate: DateTime.now()));
    }

    return response.copyWith(medications: deactivatedMeds);
  }

  Future<Medication> deactivateMedication(Patient patient, Medication med) async {
    final response = med.copyWith(treatmentStatus: TreatmentStatus.discontinued, lastUpdate: DateTime.now());

    return response;
  }

  Future<Medication> reactivateMedication(Patient patient, Medication med) async {
    final response = med.copyWith(treatmentStatus: TreatmentStatus.active, lastUpdate: DateTime.now());

    return response;
  }
}

class _MockData {
  final List<Map<String, dynamic>> prescriptions = [
    {
      'id': 1,
      'code': 'RX12345',
      'created_at': '2025-04-20T10:00:00',
      'updated_at': '2025-04-20T10:00:00',
      'nome_medico': 'Henrique Oliveira Santos',
      'especialidade': 'Cardiologista',
      'expira_em': '2025-05-20T10:00:00',
      'ativa': 1,
      'medicacoes': [
        {
          'medicamento': {
            'id': 1,
            'nome': 'Paracetamol',
            'tipo': 1, // pill
            'descricao': 'Analgésico e antitérmico',
            'dosagem': '500.0',
          },
          'updated_at': '2025-04-20T10:00:00',
          'primeira_dose': '07:00',
          'frequencia': 2, // every8Hours
          'status': 1,
          'instrucoes': [],
          'foi_tomado': 0,
          'dosagem': 1.0,
        },
        {
          'medicamento': {
            'id': 2,
            'nome': 'Vitamina C',
            'tipo': 1, // pill
            'descricao': 'Fortalece o sistema imunológico',
            'dosagem': '1000.0',
            'updated_at': '2025-04-20T10:00:00',
          },
          'updated_at': '2025-04-20T10:00:00',
          'primeira_dose': '08:00',
          'frequencia': 4, // singleDose
          'instrucoes': [],
          'status': 1,
          'foi_tomado': 0,
          'dosagem': 2.0,
        },
      ]
    },
    {
      'id': 2,
      'code': 'RX67890',
      'created_at': '2025-04-22T15:30:00',
      'updated_at': '2025-04-20T10:00:00',
      'nome_medico': 'Beatriz Costa',
      'especialidade': 'Dermatologista',
      'expira_em': '2025-05-22T15:30:00',
      'ativa': 1,
      'medicacoes': [
        {
          'medicamento': {
            'id': 3,
            'nome': 'Xarope para Tosse',
            'tipo': 3, // syrup
            'descricao': 'Alivia a tosse e descongestiona',
            'dosagem': '10.0',
          },
          'updated_at': '2025-04-20T10:00:00',
          'primeira_dose': '09:00',
          'frequencia': 2, // every6Hours
          'instrucoes': [1],
          'status': 1,
          'foi_tomado': 0,
          'dosagem': 10.0,
        },
      ]
    },
  ];
}
