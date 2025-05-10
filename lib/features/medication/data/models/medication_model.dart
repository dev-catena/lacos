import '../../domain/entities/medication.dart';

class MedicationModel extends Medication {
  MedicationModel({
    required super.medicine,
    required super.frequency,
    required super.firstDose,
    required super.dosage,
    required super.treatmentStatus,
    required super.hasTaken,
    required super.usageInstructions,
    required super.lastUpdate,
  });


  Medication toEntity() {
    return Medication(
      medicine: medicine,
      frequency: frequency,
      firstDose: firstDose,
      dosage: dosage,
      hasTaken: hasTaken,
      treatmentStatus: treatmentStatus,
      usageInstructions: usageInstructions,
        lastUpdate: lastUpdate,
    );
  }
}
