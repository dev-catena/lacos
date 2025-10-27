import 'dart:math';

import '../../../../common/domain/entities/patient.dart';
import '../../domain/entities/doctor.dart';

class DoctorDataSource {
  Future<List<Doctor>> getPatientDoctors(Patient patient) async {
    final rawData = _MockData().doctors.map((e) => Doctor.fromJson(e)).toList();

    return rawData;
  }

  Future<Doctor> registerDoctor(Patient patient, Doctor doctor) async {
    // final Map<String, dynamic> content = {'paciente_id': patient.self.id, 'medico': doctor.toRemote()};

    final response = doctor.copyWith(id: Random().nextInt(5000) + 100);

    return response;
  }
}

class _MockData {
  final List<Map<String, dynamic>> doctors = [
    {
      'id': 1,
      'nome': 'Henrique Oliveira Santos',
      'especialidade': 'Cardiologia',
      'crm': '2156156-01',
      'telefone': '99405-4512',
      'email': 'antonio@gmail.com',
      'endereco': 'Av. Churchil, n 36 - Santa Efigência, Belo Horizonte',
    },
    {
      'id': 2,
      'nome': 'Beatriz Costa',
      'especialidade': 'Dermatologia',
      'crm': '3245123-02',
      'telefone': '99234-8876',
      'email': 'beatriz.costa@gmail.com',
      'endereco': 'Rua das Palmeiras, 120 - Savassi, Belo Horizonte',
    },
    {
      'id': 3,
      'nome': 'Carlos Henrique',
      'especialidade': 'Ortopedia',
      'crm': '1987456-03',
      'telefone': '99123-4567',
      'email': 'carlos.henrique@gmail.com',
      'endereco': 'Av. Amazonas, 456 - Centro, Belo Horizonte',
    },
    {
      'id': 4,
      'nome': 'Daniela Mendes',
      'especialidade': 'Pediatria',
      'crm': '2856743-04',
      'telefone': '99321-7890',
      'email': 'daniela.mendes@gmail.com',
      'endereco': 'Rua Padre Eustáquio, 89 - Padre Eustáquio, Belo Horizonte',
    },
  ];
}
