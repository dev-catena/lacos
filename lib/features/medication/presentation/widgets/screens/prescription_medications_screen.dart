import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/routes.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';
import '../../../domain/entities/prescription.dart';

class PrescriptionMedicationsScreen extends StatelessWidget {
  const PrescriptionMedicationsScreen(this.prescription, {super.key});

  final Prescription prescription;

  @override
  Widget build(BuildContext context) {
    final titleMedium = Theme.of(context).textTheme.titleMedium!;

    return CustomScaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.pushNamed(AppRoutes.newMedicineScreen, extra: prescription),
        child: const Icon(Icons.add),
      ),
      child: Column(
        children: [
          prescription.buildHeader(),
          const SizedBox(height: 10),
          const Divider(),
          const SizedBox(height: 10),
          Text('Medicações', style: titleMedium),
          const SizedBox(height: 10),
          ...List.generate(
            prescription.medications.length,
            (index) {
              final med = prescription.medications[index];

              return med.buildTile(onTap: (){});
            },
          ),
        ],
      ),
    );
  }
}
