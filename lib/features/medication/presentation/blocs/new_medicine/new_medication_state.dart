part of 'new_medication_bloc.dart';

@immutable
sealed class NewMedicationState {}

final class NewMedicationInitial extends NewMedicationState {}

final class NewMedicationLoadInProgress extends NewMedicationState {}

final class NewMedicationReady extends NewMedicationState {
  final Doctor? doctorSelected;
  final List<Medicine> medicines;
  final Medicine? medicineSelected;
  final String? concentrationSelected;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool isContinuous;
  final TimeOfDay? firstDoseTime;

  static const _unset = Object();

  NewMedicationReady copyWith({
    Object? doctorSelected = _unset,
    Object? medicines = _unset,
    Object? medicineSelected = _unset,
    Object? concentrationSelected = _unset,
    Object? startDate = _unset,
    Object? endDate = _unset,
    Object? isContinuous = _unset,
    Object? firstDoseTime = _unset,
  }) {
    return NewMedicationReady(
      doctorSelected: doctorSelected != _unset ? doctorSelected as Doctor? : this.doctorSelected,
      medicines: medicines != _unset ? medicines as List<Medicine> : this.medicines,
      medicineSelected: medicineSelected != _unset ? medicineSelected as Medicine? : this.medicineSelected,
      concentrationSelected:
          concentrationSelected != _unset ? concentrationSelected as String? : this.concentrationSelected,
      startDate: startDate != _unset ? startDate as DateTime? : this.startDate,
      endDate: endDate != _unset ? endDate as DateTime? : this.endDate,
      isContinuous: isContinuous != _unset ? isContinuous as bool : this.isContinuous,
      firstDoseTime: firstDoseTime != _unset ? firstDoseTime as TimeOfDay? : this.firstDoseTime,
    );
  }

  NewMedicationReady({
    required this.doctorSelected,
    required this.medicines,
    required this.medicineSelected,
    required this.concentrationSelected,
    required this.startDate,
    required this.endDate,
    required this.firstDoseTime,
    this.isContinuous = false,
  });
}

final class NewMedicationError extends NewMedicationState {
  final String msg;

  NewMedicationError(this.msg);
}
