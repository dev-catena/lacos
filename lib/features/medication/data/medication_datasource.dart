import 'package:flutter/material.dart';

import '../domain/entities/medicine.dart';

class MedicationDataSource {
  Future<List<Medication>> getMedications() async {
    final List<Medication> rawData = _MockData().medications;

    return rawData;
  }
}

class _MockData {
  final List<Medication> medications = [
    Medication(
      medicine: const Medicine(
        name: 'Paracetamol',
        type: MedicineType.pill,
        description: 'Analgésico e antitérmico',
        dosage: 500.0,
      ),
      frequency: MedicineFrequency.every8Hours,
      firstDose: const TimeOfDay(hour: 7, minute: 0),
    ),
    Medication(
      medicine: const Medicine(
        name: 'Xarope para Tosse',
        type: MedicineType.syrup,
        description: 'Alivia a tosse e descongestiona',
        dosage: 10.0,
      ),
      frequency: MedicineFrequency.every6Hours,
      firstDose: const TimeOfDay(hour: 8, minute: 0),
    ),
    Medication(
      medicine: const Medicine(
        name: 'Xarope',
        type: MedicineType.syrup,
        description: 'Alivia a tosse',
        dosage: 10.0,
      ),
      frequency: MedicineFrequency.every6Hours,
      firstDose: const TimeOfDay(hour: 6, minute: 0),
    ),
    Medication(
      medicine: const Medicine(
        name: 'Pomada Anti-inflamatória',
        type: MedicineType.ointment,
        description: 'Reduz a inflamação e alivia a dor nas articulações',
        dosage: 2.0,
      ),
      frequency: MedicineFrequency.every12Hours,
      firstDose: const TimeOfDay(hour: 9, minute: 0),
    ),
    Medication(
      medicine: const Medicine(
        name: 'Vitamina C',
        type: MedicineType.pill,
        description: 'Fortalece o sistema imunológico',
        dosage: 1000.0,
      ),
      frequency: MedicineFrequency.singleDose,
      firstDose: const TimeOfDay(hour: 8, minute: 0),
    ),
    Medication(
      medicine: const Medicine(
        name: 'Insulina',
        type: MedicineType.injection,
        description: 'Controle de níveis de glicose no sangue',
        dosage: 10.0,
      ),
      frequency: MedicineFrequency.every12Hours,
      firstDose: const TimeOfDay(hour: 7, minute: 0),
    ),
  ];
}
