part of 'medication_bloc.dart';

@immutable
sealed class MedicationEvent {}

class MedicationStarted extends MedicationEvent {}
