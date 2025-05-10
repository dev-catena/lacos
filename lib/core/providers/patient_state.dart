part of 'patient_cubit.dart';

@immutable
sealed class PatientState {}

final class PatientInitial extends PatientState {}

final class PatientReady extends PatientState {
  final List<Doctor> doctors;
  final List<Prescription> prescription;

  PatientReady copyWith({
    List<Doctor>? doctors,
    List<Prescription>? prescription,
  }) {
    return PatientReady(
      doctors: doctors ?? this.doctors,
      prescription: prescription ?? this.prescription,
    );
  }

  PatientReady({required this.doctors, required this.prescription});
}
