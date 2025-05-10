import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/providers/app_data_cubit.dart';
import '../../../../../core/providers/user_cubit.dart';
import '../../../../common/domain/entities/medicine.dart';
import '../../../../common/presentation/widgets/components/custom_selectable_tile.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';
import '../../../../common/presentation/widgets/dialogs/single_select_dialog.dart';
import '../../../../companion_home/patient_profile/presentation/widgets/dialogs/new_medicine_dialog.dart';
import '../../../domain/entities/medication.dart';
import '../../../domain/entities/prescription.dart';
import '../../blocs/new_medicine/new_medication_bloc.dart';
import '../components/treatment_duration.dart';

class NewMedicationScreen extends StatelessWidget {
  const NewMedicationScreen(this.prescription, {super.key});

  final Prescription prescription;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => NewMedicationBloc(prescription),
      child: CustomScaffold(
        child: BlocBuilder<NewMedicationBloc, NewMedicationState>(
          builder: (blocCtx, state) {
            final bloc = blocCtx.read<NewMedicationBloc>();
            switch (state) {
              case NewMedicationInitial():
                bloc.add(NewMedicationStarted());
                return const CircularProgressIndicator();
              case NewMedicationLoadInProgress():
                return const CircularProgressIndicator();
              case NewMedicationReady():
                return _ReadyScreen(state);
              case NewMedicationError():
                return Column(
                  children: [
                    const Text('No state'),
                    IconButton(
                        onPressed: () => bloc.add(NewMedicationStarted()), icon: const Icon(Icons.refresh_outlined)),
                  ],
                );
            }
          },
        ),
      ),
    );
  }
}

class _ReadyScreen extends StatelessWidget {
  const _ReadyScreen(this.state);

  final NewMedicationReady state;

  @override
  Widget build(BuildContext context) {
    final titleLarge = Theme.of(context).textTheme.titleLarge!;
    final titleMedium = Theme.of(context).textTheme.titleMedium!;
    final bloc = context.read<NewMedicationBloc>();
    final userData = context.read<UserCubit>();
    final appData = context.read<AppDataCubit>();
    final bool canRegister = state.medicineSelected != null &&
        state.frequencySelected != null &&
        state.startDate != null &&
        state.firstDoseTime != null &&
        state.firstDoseTime != null;

    return Column(
      children: [
        Text('Cadastro de nova medicação', style: titleLarge),
        const SizedBox(height: 12),
        state.prescription.buildHeader(),
        const SizedBox(height: 10),
        const Divider(),
        const SizedBox(height: 10),
        Text('Medicação', style: titleMedium),
        const SizedBox(height: 6),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(width: 20),
            CustomSelectableTile(
              title: state.medicineSelected?.name ?? 'Medicamento',
              isActive: state.medicineSelected != null,
              onTap: () {
                showDialog(
                  context: context,
                  builder: (_) => SingleSelectDialog<Medicine>(
                    title: 'Selecione o medicamento',
                    options: appData.medicines!,
                    getName: (option) => option.name,
                    onChoose: (value) {
                      bloc.add(NewMedicationMedicineSelected(value));
                    },
                    optionSelected: state.medicineSelected,
                  ),
                );
              },
            ),
            IconButton(
              onPressed: () {
                showDialog(context: context, builder: (_) => const NewMedicineDialog());
              },
              icon: const Icon(Icons.add_circle_outline),
            ),
          ],
        ),
        const SizedBox(height: 10),
        const Divider(),
        const SizedBox(height: 10),
        Text('Tratamento', style: titleMedium),
        const SizedBox(height: 10),
        DropdownMenu<String>(
          width: 200,
          dropdownMenuEntries: const [
            DropdownMenuEntry(value: '0', label: '1 vez ao dia'),
            DropdownMenuEntry(value: '2', label: '2 em 2 horas'),
            DropdownMenuEntry(value: '4', label: '4 em 4 horas'),
            DropdownMenuEntry(value: '6', label: '6 em 6 horas'),
            DropdownMenuEntry(value: '8', label: '8 em 8 horas'),
            DropdownMenuEntry(value: '12', label: '12 em 12 horas'),
            DropdownMenuEntry(value: 'sn', label: 'Sem frequência'),
          ],
          label: const Text('Frequência de uso', textAlign: TextAlign.center),
          initialSelection: state.frequencySelected?.hoursInterval.toString(),
          onSelected: (value) {
            bloc.add(NewMedicationFrequencySelected(MedicationFrequency.fromString(value!)));
          },
        ),
        const SizedBox(height: 10),
        TreatmentDuration(
          onCheck: (value) => bloc.add(NewMedicationContinuousSelected(value)),
          onDatePicked: (date) => bloc.add(NewMedicationStartChosen(date)),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 100,
              child: TextField(
                onEditingComplete: () => FocusScope.of(context).unfocus(),
                onTapOutside: (_) => FocusScope.of(context).unfocus(),
                onSubmitted: (_) => FocusScope.of(context).unfocus(),
                decoration: const InputDecoration(
                  label: Text('Dosagem'),
                ),
                keyboardType: TextInputType.number,
              ),
            ),
            const SizedBox(width: 10),
            PopupMenuButton<String>(
              onSelected: (value) {},
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'Comprimido', child: Text('Comprimido')),
                const PopupMenuItem(value: 'gota', child: Text('gota')),
                const PopupMenuItem(value: 'ml', child: Text('ml')),
              ],
              child: const Row(
                children: [
                  Text('comprimido'),
                  Icon(Icons.arrow_drop_down),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        const Text('Horário da primeira dose'),
        CustomSelectableTile(
          title: state.firstDoseTime?.format(context) ?? 'Horário',
          onTap: () {
            showTimePicker(
              context: context,
              initialEntryMode: TimePickerEntryMode.input,
              initialTime: state.firstDoseTime ?? TimeOfDay.now(),
              helpText: 'Defina o horário',
              hourLabelText: 'Hora',
              minuteLabelText: 'Minuto',
              cancelText: 'Cancelar',
              confirmText: 'Confirmar',
            ).then(
              (value) => bloc.add(NewMedicationTimeChosen(value)),
            );
          },
          isActive: state.firstDoseTime != null,
        ),
        const SizedBox(height: 10),
        const Divider(),
        const SizedBox(height: 10),
        Text('Instruções de uso', style: titleMedium),
        const SizedBox(height: 10),
        ...List.generate(
          state.instructions.length + 1,
          (index) {
            if (index ==  state.instructions.length) {
              return IconButton(
                  onPressed: () => showDialog(
                        context: context,
                        builder: (context) {
                          final instructions = List<UsageInstructions>.of(UsageInstructions.values);
                          instructions.removeWhere((element) => state.instructions.contains(element));
                          return SingleSelectDialog<UsageInstructions>(
                            title: 'Selecione uma instrução de uso',
                            options: instructions,
                            getName: (option) => option.description,
                            onChoose: (value) {
                              bloc.add(NewMedicationInstructionAdded(value));
                            },
                            optionSelected: null,
                          );
                        },
                      ),
                  icon: const Icon(Icons.add_circle_outline, size: 30));
            } else {
              return Text( state.instructions[index].description);
            }
          },
        ),
        const SizedBox(height: 10),
        FilledButton(
          onPressed: () {
            final med = Medication(
              medicine: state.medicineSelected!,
              frequency: state.frequencySelected!,
              firstDose: state.firstDoseTime!,
              dosage: 30,
              usageInstructions: state.instructions,
              hasTaken: false,
              treatmentStatus: TreatmentStatus.active,
              lastUpdate: DateTime.now(),

            );
            userData.addMedication(med);
            context.pop();
          },
          style: ButtonStyle(backgroundColor: canRegister ? null : const WidgetStatePropertyAll(Colors.grey)),
          child: const Text('Cadastrar'),
        ),
      ],
    );
  }
}
