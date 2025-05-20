import '../../companion_home/domain/entities/patient_event.dart';
import '../../companion_home/patient_profile/domain/entities/doctor.dart';

class AgendaAppointment {
  final int id;
  final DateTime scheduledTo;
  final String description;
  final Doctor? doctor;

  PatientEvent toGenericEvent() {
    return PatientEvent(id: id, eventType: PatientEventType.appointment, description: description);
  }

  factory AgendaAppointment.fromGenericEvent(PatientEvent event) {
    return AgendaAppointment(
      id: event.id,
      scheduledTo: event.dateTime ?? DateTime.now(),
      description: event.title ?? '',
      doctor: null,
    );
  }

  AgendaAppointment({
    required this.id,
    required this.scheduledTo,
    required this.description,
    required this.doctor,
  });
}
