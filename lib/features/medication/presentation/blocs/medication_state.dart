part of 'medication_bloc.dart';

@immutable
sealed class MedicationState {}

final class MedicinesInitial extends MedicationState {}

final class MedicinesLoadInProgress extends MedicationState {}

final class MedicinesReady extends MedicationState {
  final List<Medication> medications;

  MedicinesReady({required this.medications});
}

final class MedicinesError extends MedicationState {
  final String msg;

  MedicinesError(this.msg);
}
