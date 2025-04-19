import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../core/providers/patient_cubit.dart';
import '../../../../common/presentation/widgets/components/custom_selectable_tile.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';
import '../../../../common/presentation/widgets/dialogs/single_select_dialog.dart';
import '../../../../home/patient_profile/domain/entities/doctor.dart';

class NewMedicineScreen extends StatelessWidget {
  const NewMedicineScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final patientData = context.read<PatientCubit>();
    final titleLarge = Theme.of(context).textTheme.titleLarge!;

    return CustomScaffold(

      child: Column(
        children: [
          Text('Cadastro de novo medicamento', style: titleLarge),
          const SizedBox(height: 12),
          Center(
            child: CustomSelectableTile(
              title: 'Prescrito por',
              isActive: false,
              onTap: () {
                showDialog(
                  context: context,
                  builder: (context) => SingleSelectDialog<Doctor>(
                    title: 'Selecione o médico',
                    options: patientData.doctors,
                    getName: (option) => option.name,
                    onChoose: (value) {},
                    optionSelected: null,
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
