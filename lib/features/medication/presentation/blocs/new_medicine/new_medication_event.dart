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

class NewMedicationConcentrationSelected extends NewMedicationEvent {
  final String concentrationSelected;

  NewMedicationConcentrationSelected(this.concentrationSelected);
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
