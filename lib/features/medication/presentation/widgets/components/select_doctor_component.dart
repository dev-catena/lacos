import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../core/providers/patient_cubit.dart';
import '../../../../common/presentation/widgets/components/custom_selectable_tile.dart';
import '../../../../common/presentation/widgets/dialogs/single_select_dialog.dart';
import '../../../../companion_home/patient_profile/domain/entities/doctor.dart';
import '../../../../companion_home/patient_profile/presentation/widgets/dialogs/register_new_doctor_dialog.dart';

class SelectDoctorComponent extends StatefulWidget {
  const SelectDoctorComponent({super.key, required this.onSelect});

  final void Function(Doctor doctorSelected) onSelect;

  @override
  State<SelectDoctorComponent> createState() => _SelectDoctorComponentState();
}

class _SelectDoctorComponentState extends State<SelectDoctorComponent> {
  Doctor? doctorSelected;

  void onDoctorSelected(Doctor newDoc) {
    debugPrint('$runtimeType - newDoc == doctorSelected ${newDoc == doctorSelected}');
    debugPrint('$runtimeType - newDoc $newDoc');
    debugPrint('$runtimeType - doctorSelected $doctorSelected');

    if (newDoc == doctorSelected) {
      doctorSelected = null;
    } else {
      doctorSelected = newDoc;
    }

    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final patientData = context.read<PatientCubit>();

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      mainAxisSize: MainAxisSize.min,
      children: [
        CustomSelectableTile(
          title: doctorSelected?.name ?? 'Prescrito por',
          isActive: doctorSelected != null,
          onTap: () {
            showDialog(
              context: context,
              builder: (_) => SingleSelectDialog<Doctor>(
                title: 'Selecione o médico',
                options: patientData.doctors,
                getName: (option) => option.name,
                onChoose: (value) {
                  widget.onSelect(value);
                  onDoctorSelected(value);
                },
                optionSelected: doctorSelected,
              ),
            );
          },
        ),
        IconButton(
          onPressed: () {
            showDialog(context: context, builder: (_) => const RegisterNewDoctorDialog());
          },
          icon: const Icon(Icons.add_circle_outline),
        ),
      ],
    );
  }
}
