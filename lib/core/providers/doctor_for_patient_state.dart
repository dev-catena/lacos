part of 'patient_cubit.dart';

@immutable
sealed class PatientState {}

final class PatientInitial extends PatientState {}

final class PatientReady extends PatientState {
  final List<Doctor> doctors;

  PatientReady({required this.doctors});
}
