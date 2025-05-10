part of 'new_medication_bloc.dart';

@immutable
sealed class NewMedicationState {}

final class NewMedicationInitial extends NewMedicationState {}

final class NewMedicationLoadInProgress extends NewMedicationState {}

final class NewMedicationReady extends NewMedicationState {
  final Prescription prescription;
  final Doctor? doctorSelected;
  final List<Medicine> medicines;
  final Medicine? medicineSelected;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool isContinuous;
  final MedicationFrequency? frequencySelected;
  final TimeOfDay? firstDoseTime;
  final List<UsageInstructions> instructions;

  static const _unset = Object();

  NewMedicationReady copyWith({
    Object? doctorSelected = _unset,
    Object? medicines = _unset,
    Object? medicineSelected = _unset,
    Object? startDate = _unset,
    Object? endDate = _unset,
    Object? isContinuous = _unset,
    Object? frequencySelected = _unset,
    Object? firstDoseTime = _unset,
    Object? instructions = _unset,
  }) {
    return NewMedicationReady(
      prescription: prescription,
      doctorSelected: doctorSelected != _unset ? doctorSelected as Doctor? : this.doctorSelected,
      medicines: medicines != _unset ? medicines as List<Medicine> : this.medicines,
      medicineSelected: medicineSelected != _unset ? medicineSelected as Medicine? : this.medicineSelected,
      startDate: startDate != _unset ? startDate as DateTime? : this.startDate,
      endDate: endDate != _unset ? endDate as DateTime? : this.endDate,
      isContinuous: isContinuous != _unset ? isContinuous as bool : this.isContinuous,
      frequencySelected: frequencySelected != _unset ? frequencySelected as MedicationFrequency : this.frequencySelected,
      firstDoseTime: firstDoseTime != _unset ? firstDoseTime as TimeOfDay? : this.firstDoseTime,
      instructions: instructions != _unset ? instructions as List<UsageInstructions> : this.instructions,
    );
  }

  NewMedicationReady({
    required this.prescription,
    required this.doctorSelected,
    required this.medicines,
    required this.medicineSelected,
    required this.startDate,
    required this.endDate,
    required this.frequencySelected,
    required this.firstDoseTime,
    required this.instructions,
    this.isContinuous = false,
  });
}

final class NewMedicationError extends NewMedicationState {
  final String msg;

  NewMedicationError(this.msg);
}
