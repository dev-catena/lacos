import 'dart:math';

import '../../../agenda/entities/agenda_appointment.dart';
import '../../../companion_home/domain/entities/patient_event.dart';

class AgendaDataSource {
  Future<List<AgendaAppointment>> getAppointments() async {
    final data = _MockData().appointments.map((e) => AgendaAppointment.fromGenericEvent(e)).toList();

    return data;
  }

  Future<PatientEvent> addAppointment(final PatientEvent appointment) async {
    // final content = {};

    return appointment.copyWith(id: Random().nextInt(5000) + 1000);
  }
}

class _MockData {
  final appointments = [
    PatientEvent(
      id: 35,
      eventType: PatientEventType.appointment,
      description: 'Dr. Cleber Leite',
      title: 'Cardiologista',
      dateTime: DateTime.now().add(const Duration(days: 1)),
    ),
    PatientEvent(
      id: 23,
      eventType: PatientEventType.appointment,
      description: 'Dra. Maria Rosa',
      title: 'Dentista',
      dateTime: DateTime.now(),
    ),
    PatientEvent(
      id: 56,
      eventType: PatientEventType.appointment,
      description: 'Dra. Carla Moraes',
      title: 'Demartologista',
      dateTime: DateTime(2025, 2, 14, 08, 20),
    ),
    PatientEvent(
      id: 77,
      eventType: PatientEventType.appointment,
      description: 'Dr. Pedro Lima',
      title: 'Ortopedista',
      dateTime: DateTime(2025, 1, 22, 10, 00),
    ),
  ];
}
