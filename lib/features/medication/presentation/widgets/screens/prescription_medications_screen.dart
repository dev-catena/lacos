import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/providers/patient_cubit.dart';
import '../../../../../core/providers/user_cubit.dart';
import '../../../../../core/routes.dart';
import '../../../../../core/utils/custom_colors.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';
import '../../../domain/entities/medication.dart';
import '../../../domain/entities/prescription.dart';

class PrescriptionMedicationsScreen extends StatefulWidget {
  const PrescriptionMedicationsScreen(this.prescription, {super.key});

  final Prescription prescription;

  @override
  State<PrescriptionMedicationsScreen> createState() => _PrescriptionMedicationsScreenState();
}

class _PrescriptionMedicationsScreenState extends State<PrescriptionMedicationsScreen> {
  @override
  Widget build(BuildContext context) {
    final titleMedium = Theme.of(context).textTheme.titleMedium!;
    final userData = context.watch<UserCubit>();
    final patientData = context.watch<PatientCubit>();

    return CustomScaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.pushNamed(AppRoutes.newMedicineScreen, extra: widget.prescription),
        child: const Icon(Icons.add),
      ),
      child: Column(
        children: [
          widget.prescription.buildHeader(),
          const SizedBox(height: 10),
          const Divider(),
          const SizedBox(height: 10),
          Text('Medicações', style: titleMedium),
          const SizedBox(height: 10),
          ...List.generate(
            widget.prescription.medications.length,
            (index) {
              final med = widget.prescription.medications[index];

              return med.buildTile(
                onTap: () {},
                trailing: IconButton(
                  tooltip:
                      med.treatmentStatus == TreatmentStatus.active ? 'Descontinuar medicação' : 'Reativar medicação',
                  onPressed: () async {
                    if (med.treatmentStatus == TreatmentStatus.active) {
                      await patientData.deactivateMedication(userData.currentPatient!, widget.prescription, med);
                    } else {
                      await patientData.reactivateMedication(userData.currentPatient!, widget.prescription, med);
                    }
                    setState(() {});
                  },
                  icon: med.treatmentStatus == TreatmentStatus.active
                      ? const Icon(Icons.cancel_outlined, color: CustomColor.vividRed)
                      : const Icon(Icons.restart_alt, color: CustomColor.successGreen),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
