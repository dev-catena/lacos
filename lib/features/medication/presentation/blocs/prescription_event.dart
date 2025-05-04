part of 'prescription_bloc.dart';

@immutable
sealed class PrescriptionEvent {}

class PrescriptionStarted extends PrescriptionEvent {}

class PrescriptionRegistered extends PrescriptionEvent {
  final Prescription newPrescription;

  PrescriptionRegistered(this.newPrescription);
}
