import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../domain/entities/medication.dart';

class DiscontinuedMedicationTab extends StatelessWidget {
  const DiscontinuedMedicationTab(this.medications, {super.key});

  final List<Medication> medications;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ...medications.map((e) => e.buildTile(onTap: () {}, trailing: Text('Descontinuado em\n${DateFormat('dd/MM/y').format(e.lastUpdate)}'))),
      ],
    );
  }
}
