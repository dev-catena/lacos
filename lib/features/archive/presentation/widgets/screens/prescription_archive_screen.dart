import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../../../../core/providers/patient_cubit.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';

class PrescriptionArchiveScreen extends StatelessWidget {
  const PrescriptionArchiveScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final patientData = context.watch<PatientCubit>();
    final inactivePres = patientData.prescriptions.where((element) => !element.isActive).toList();

    return CustomScaffold(
      child: Column(
        children: [
          ...List.generate(
            inactivePres.length,
                (index) {
              final pres = inactivePres[index];
              return pres.buildTile(
                  onTap: () {
                    showDialog(
                      context: context,
                      builder: (context) {
                        return SimpleDialog(
                          children: [
                          ],
                        );
                      },
                    );
                  },
                  trailing: Text('Descontinuado em\n${DateFormat('dd/MM/y').format(pres.lastUpdate)}'));
            },
          ),
        ],
      ),
    );
  }
}
