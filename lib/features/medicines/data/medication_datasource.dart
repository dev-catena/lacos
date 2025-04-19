import 'package:flutter/material.dart';

import '../domain/entities/medicine.dart';

class MedicationDataSource {
  Future<List<Medicine>> getMedicines() async {
    final List<Medicine> rawData = _MockData().medicines;

    return rawData;
  }
}


class _MockData {
  final List<Medicine> medicines = [
    const Medicine(
      name: 'Paracetamol',
      type: MedicineType.pill,
      description: 'Analgésico e antitérmico',
      dosage: 500.0,
      frequency: MedicineFrequency.every8Hours,
      firstDose: TimeOfDay(hour: 7, minute: 0),
    ),

    const Medicine(
      name: 'Xarope para Tosse',
      type: MedicineType.syrup,
      description: 'Alivia a tosse e descongestiona',
      dosage: 10.0,
      // 10 ml por dose
      frequency: MedicineFrequency.every6Hours,
      firstDose: TimeOfDay(hour: 8, minute: 0),
    ),

    const Medicine(
      name: 'Xarope',
      type: MedicineType.syrup,
      description: 'Alivia a tosse',
      dosage: 10.0,
      // 10 ml por dose
      frequency: MedicineFrequency.every6Hours,
      firstDose: TimeOfDay(hour: 6, minute: 0),
    ),

    const Medicine(
      name: 'Pomada Anti-inflamatória',
      type: MedicineType.ointment,
      description: 'Reduz a inflamação e alivia a dor nas articulações',
      dosage: 2.0,
      // 2g por aplicação
      frequency: MedicineFrequency.every12Hours,
      firstDose: TimeOfDay(hour: 9, minute: 0),
    ),

    const Medicine(
      name: 'Vitamina C',
      type: MedicineType.pill,
      description: 'Fortalece o sistema imunológico',
      dosage: 1000.0,
      // 1000 mg por cápsula
      frequency: MedicineFrequency.singleDose,
      firstDose: TimeOfDay(hour: 8, minute: 0),
    ),

    const Medicine(
      name: 'Insulina',
      type: MedicineType.injection,
      description: 'Controle de níveis de glicose no sangue',
      dosage: 10.0,
      // 10 ml por aplicação
      frequency: MedicineFrequency.every12Hours,
      firstDose: TimeOfDay(hour: 7, minute: 0),
    ),
  ];
}