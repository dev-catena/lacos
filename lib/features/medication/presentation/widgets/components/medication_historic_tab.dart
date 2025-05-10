import 'package:flutter/material.dart';

import '../../../domain/entities/medication.dart';

class MedicationHistoricTab extends StatelessWidget {
  const MedicationHistoricTab(this.medications, {super.key});

  final List<Medication> medications;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ...medications.map((e) => e.buildTile(onTap: () {})),
      ],
    );
  }
}
