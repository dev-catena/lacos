import '../../domain/entities/medication.dart';

class MedicationModel extends Medication {
  MedicationModel({
    required super.medicine,
    required super.frequency,
    required super.firstDose,
    super.hasTaken,
    super.usageInstructions,
  });


  Medication toEntity() {
    return Medication(
      medicine: medicine,
      frequency: frequency,
      firstDose: firstDose,
      hasTaken: hasTaken,
      usageInstructions: usageInstructions,
    );
  }
}
