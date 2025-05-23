part of 'new_medication_bloc.dart';

@immutable
sealed class NewMedicationEvent {}

class NewMedicationStarted extends NewMedicationEvent {}

class NewMedicationDoctorSelected extends NewMedicationEvent {
  final Doctor doctorSelected;

  NewMedicationDoctorSelected(this.doctorSelected);
}

class NewMedicationMedicineSelected extends NewMedicationEvent {
  final Medicine medicineSelected;

  NewMedicationMedicineSelected(this.medicineSelected);
}

class NewMedicationFrequencySelected extends NewMedicationEvent {
  final MedicationFrequency frequency;

  NewMedicationFrequencySelected(this.frequency);
}

class NewMedicationStartChosen extends NewMedicationEvent {
  final DateTime? date;

  NewMedicationStartChosen(this.date);
}

class NewMedicationEndChosen extends NewMedicationEvent {
  final DateTime? date;

  NewMedicationEndChosen(this.date);
}

class NewMedicationContinuousSelected extends NewMedicationEvent {
  final bool? isContinuous;

  NewMedicationContinuousSelected(this.isContinuous);
}

class NewMedicationTimeChosen extends NewMedicationEvent {
  final TimeOfDay? time;

  NewMedicationTimeChosen(this.time);
}

class NewMedicationInstructionAdded extends NewMedicationEvent {
  final UsageInstructions instruction;

  NewMedicationInstructionAdded(this.instruction);
}

class NewMedicationInstructionRemoved extends NewMedicationEvent {
  final UsageInstructions instruction;

  NewMedicationInstructionRemoved(this.instruction);
}

class NewMedicationIntervalSelected extends NewMedicationEvent {
  final MedicationScheduleType type;
  final dynamic value;

  NewMedicationIntervalSelected(this.type, this.value);
}

class NewMedicationDosageSet extends NewMedicationEvent {
  final String type;
  final int value;

  NewMedicationDosageSet(this.type, this.value);
}

class NewMedicationDurationSet extends NewMedicationEvent {
  final DateTime start;
  final DateTime? end;
  final bool isContinuous;

  NewMedicationDurationSet(this.start, this.isContinuous, [this.end]);
}
