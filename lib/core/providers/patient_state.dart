part of 'patient_cubit.dart';

@immutable
sealed class PatientState {}

final class PatientInitial extends PatientState {}

final class PatientReady extends PatientState {
  final List<Doctor> doctors;

  PatientReady copyWith({
    List<Doctor>? doctors,
  }) {
    return PatientReady(
      doctors: doctors ?? this.doctors,
    );
  }

  PatientReady({required this.doctors});
}
