import '../../domain/entities/doctor.dart';

class DoctorDataSource {
  Future<List<Doctor>> getPatientDoctors() async {
    final rawData = _MockData().doctors;

    return rawData;
  }
}

class _MockData {
  final List<Doctor> doctors = [
    const Doctor(
      id: 1,
      name: 'Henrique Oliveira Santos',
      speciality: 'Cardiologia',
      CRM: '2156156-01',
      phoneNumber: '99405-4512',
      email: 'antonio@gmail.com',
      address: 'Av. Churchil, n 36 - Santa Efigência, Belo Horizonte',
    ),
    const Doctor(
      id: 2,
      name: 'Beatriz Costa',
      speciality: 'Dermatologia',
      CRM: '3245123-02',
      phoneNumber: '99234-8876',
      email: 'beatriz.costa@gmail.com',
      address: 'Rua das Palmeiras, 120 - Savassi, Belo Horizonte',
    ),
    const Doctor(
      id: 3,
      name: 'Carlos Henrique',
      speciality: 'Ortopedia',
      CRM: '1987456-03',
      phoneNumber: '99123-4567',
      email: 'carlos.henrique@gmail.com',
      address: 'Av. Amazonas, 456 - Centro, Belo Horizonte',
    ),
    const Doctor(
      id: 4,
      name: 'Daniela Mendes',
      speciality: 'Pediatria',
      CRM: '2856743-04',
      phoneNumber: '99321-7890',
      email: 'daniela.mendes@gmail.com',
      address: 'Rua Padre Eustáquio, 89 - Padre Eustáquio, Belo Horizonte',
    ),
  ];
}
