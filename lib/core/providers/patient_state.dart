part of 'patient_cubit.dart';

@immutable
sealed class PatientState {}

final class PatientInitial extends PatientState {}

final class PatientReady extends PatientState {
  final List<Doctor> doctors;
  final List<Prescription> prescription;
  final List<AgendaAppointment> appointments;

  PatientReady copyWith({
    List<Doctor>? doctors,
    List<Prescription>? prescription,
    List<AgendaAppointment>? appointments,
  }) {
    return PatientReady(
      doctors: doctors ?? this.doctors,
      prescription: prescription ?? this.prescription,
      appointments: appointments ?? this.appointments,
    );
  }

  PatientReady({
    required this.doctors,
    required this.prescription,
    required this.appointments,
  });
}
