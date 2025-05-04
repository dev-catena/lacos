part of 'medication_bloc.dart';

@immutable
sealed class MedicationState {}

final class MedicationInitial extends MedicationState {}

final class MedicationLoadInProgress extends MedicationState {}

final class MedicationReady extends MedicationState {
  final List<Medication> medications;

  MedicationReady({required this.medications});
}

final class MedicationError extends MedicationState {
  final String msg;

  MedicationError(this.msg);
}
