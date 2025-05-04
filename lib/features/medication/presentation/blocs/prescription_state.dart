part of 'prescription_bloc.dart';

@immutable
sealed class PrescriptionState {}

final class PrescriptionInitial extends PrescriptionState {}

final class PrescriptionLoadInProgress extends PrescriptionState {}

final class PrescriptionReady extends PrescriptionState {
  final List<Prescription> prescriptions;

  PrescriptionReady({required this.prescriptions});

  static const _sentinel = Object();

  PrescriptionReady copyWith({Object? prescriptions = _sentinel}) {
    return PrescriptionReady(
      prescriptions: prescriptions == _sentinel
          ? this.prescriptions
          : prescriptions as List<Prescription>,
    );
  }
}

final class PrescriptionError extends PrescriptionState {}
