import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../../../core/providers/app_data_cubit.dart';
import '../../../../../../core/providers/user_cubit.dart';
import '../../../../../medication/domain/entities/medication.dart';

class NewMedicineDialog extends StatefulWidget {
  const NewMedicineDialog({super.key});

  @override
  State<NewMedicineDialog> createState() => _NewMedicineDialogState();
}

class _NewMedicineDialogState extends State<NewMedicineDialog> {
  TextEditingController nameController = TextEditingController();
  TextEditingController concentrationController = TextEditingController();
  MedicineType? typeSelected;
  String? concentrationSelected;

  void onTypeSelected(MedicineType type) {
    if (type == typeSelected) {
      typeSelected = null;
    } else {
      typeSelected = type;
    }
    setState(() {});
  }

  void onConcentrationSelected(String? selected) {
    if (selected == concentrationSelected) {
      concentrationSelected = null;
    } else {
      concentrationSelected = selected;
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final appData = context.read<AppDataCubit>();

    return AlertDialog(
      title: const Text('Cadastro de novo medicamento', textAlign: TextAlign.center),
      content: SingleChildScrollView(
        child: SizedBox(
          width: 500,
          height: 500,
          child: Column(
            children: [
              TextField(
                controller: nameController,
                onEditingComplete: () => FocusScope.of(context).unfocus(),
                onTapOutside: (_) => FocusScope.of(context).unfocus(),
                onSubmitted: (_) => FocusScope.of(context).unfocus(),
                decoration: const InputDecoration(label: Text('Nome do medicamento')),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Expanded(
                    child: TextField(
                      controller: concentrationController,
                      onEditingComplete: () => FocusScope.of(context).unfocus(),
                      onTapOutside: (_) => FocusScope.of(context).unfocus(),
                      onSubmitted: (_) => FocusScope.of(context).unfocus(),
                      decoration:  const InputDecoration(
                        label: Text('Concentração'),
                      ),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 10),
                  PopupMenuButton<String>(
                    onSelected: onConcentrationSelected,
                    itemBuilder: (_) => [
                      const PopupMenuItem(value: 'mg', child: Text('mg')),
                      const PopupMenuItem(value: 'ml', child: Text('ml')),
                    ],
                    child: Row(
                      children: [
                        Text(concentrationSelected ?? '-'),
                        const Icon(Icons.arrow_drop_down),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              GridView(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3, crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 0.7),
                shrinkWrap: true,
                children: List.generate(
                  MedicineType.values.length,
                  (index) {
                    final type = MedicineType.values[index];

                    return type.buildIcon(onTypeSelected, type == typeSelected);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
      actionsAlignment: MainAxisAlignment.spaceBetween,
      actions: [
        OutlinedButton(onPressed: ()=> context.pop(), child: const Text('Cancelar')),
        FilledButton(onPressed: () {
          final med = Medicine(name: nameController.text, type: typeSelected!, description: '', dosage: double.parse(concentrationController.text));
          appData.addMedicine(med);
          context.pop();
        }, child: const Text('Cadastrar')),
      ],
    );
  }
}
