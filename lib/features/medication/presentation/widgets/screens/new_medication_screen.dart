import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../../core/providers/app_data_cubit.dart';
import '../../../../../core/providers/patient_cubit.dart';
import '../../../../../core/providers/user_cubit.dart';
import '../../../../common/presentation/widgets/components/custom_selectable_tile.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';
import '../../../../common/presentation/widgets/dialogs/single_select_dialog.dart';
import '../../../../home/patient_profile/domain/entities/doctor.dart';
import '../../../../home/patient_profile/presentation/widgets/dialogs/new_medicine_dialog.dart';
import '../../../../home/patient_profile/presentation/widgets/dialogs/register_new_doctor_dialog.dart';
import '../../../domain/entities/medication.dart';
import '../../blocs/new_medicine/new_medication_bloc.dart';

class NewMedicationScreen extends StatelessWidget {
  const NewMedicationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => NewMedicationBloc(),
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
    final patientData = context.read<PatientCubit>();
    final bloc = context.read<NewMedicationBloc>();
    final userData = context.read<UserCubit>();
    final appData = context.read<AppDataCubit>();

    return Column(
      children: [
        Text('Cadastro de nova medicação', style: titleLarge),
        const SizedBox(height: 12),
        Text('Prescrição médica', style: titleMedium),
        const SizedBox(height: 6),

        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(width: 20),
            CustomSelectableTile(
              title: state.doctorSelected?.name ?? 'Prescrito por',
              isActive: state.doctorSelected != null,
              onTap: () {
                showDialog(
                  context: context,
                  builder: (_) => SingleSelectDialog<Doctor>(
                    title: 'Selecione o médico',
                    options: patientData.doctors,
                    getName: (option) => option.name,
                    onChoose: (value) {
                      bloc.add(NewMedicationDoctorSelected(value));
                    },
                    optionSelected: state.doctorSelected,
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
        ),
        const SizedBox(height: 10),
        const Divider(),
        const SizedBox(height: 10),
        Text('Medicação', style: titleMedium),

        // ListTile(
        //   title: Text('Remédio 1'),
        // ),
        // ListTile(
        //   title: Text('Remédio 2'),
        // ),
        // ListTile(
        //   title: Text('Remédio 3'),
        // ),
        // IconButton(onPressed: (){}, icon: Icon(Icons.add_circle_outline)),
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
        const Text('Defina a frequência de uso'),
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
          initialSelection: state.frequencySelected?.hoursInterval.toString(),
          onSelected: (value) {
            bloc.add(NewMedicationFrequencySelected(MedicineFrequency.fromString(value!)));
          },
        ),

        // SegmentedButton<String>(
        //   segments: const [
        //     ButtonSegment(value: '1 vez', label: Text('12')),
        //     ButtonSegment(value: '12', label: Text('12')),
        //     ButtonSegment(value: '8', label: Text('8')),
        //     ButtonSegment(value: '6', label: Text('6')),
        //     ButtonSegment(value: '4', label: Text('4')),
        //     ButtonSegment(value: '2', label: Text('2')),
        //   ],
        //   selected: {state.concentrationSelected ?? ''},
        //   onSelectionChanged: (newSelection) {
        //     bloc.add(NewMedicationConcentrationSelected(newSelection.first));
        //   },
        // ),

        const SizedBox(height: 10),
        const Text('Tratamento contínuo?'),
        Checkbox(
          value: state.isContinuous,
          onChanged: (value) => bloc.add(NewMedicationContinuousSelected(value)),
        ),
        const SizedBox(height: 10),
        const Text('Início do tratamento'),
        CustomSelectableTile(
          title: state.startDate != null ? DateFormat('dd/MM/yyyy', 'pt_BR').format(state.startDate!) : 'Início',
          onTap: () {
            showDatePicker(
              context: context,
              firstDate: DateTime.now(),
              initialDate: state.startDate,
              lastDate: DateTime.now().add(const Duration(days: 3650)),
            ).then((value) => bloc.add(NewMedicationStartChosen(value)));
          },
          isActive: state.startDate != null,
        ),
        const SizedBox(height: 10),
        state.isContinuous ? const SizedBox() : const Text('Fim do tratamento'),
        state.isContinuous
            ? const SizedBox()
            : CustomSelectableTile(
                title: state.endDate != null ? DateFormat('dd/MM/yyyy', 'pt_BR').format(state.endDate!) : 'Fim',
                onTap: () {
                  if (state.startDate == null) return;

                  showDatePicker(
                    context: context,
                    firstDate: state.startDate!,
                    initialDate: state.endDate,
                    lastDate: DateTime.now().add(const Duration(days: 3650)),
                  ).then((value) => bloc.add(NewMedicationEndChosen(value)));
                },
                isActive: state.endDate != null,
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
        FilledButton(
          onPressed: () {
            final med = Medication(
              medicine: state.medicineSelected!,
              frequency: state.frequencySelected!,
              firstDose: state.firstDoseTime!,
              usageInstructions: [],
              hasTaken: false,
            );
            userData.addMedication(med);
            context.pop();
          },
          child: const Text('Cadastrar'),
        ),
        // SegmentedButton<String>(
        //   segments: const [
        //     ButtonSegment(value: 'mg', label: Text('mg')),
        //     ButtonSegment(value: 'ml', label: Text('ml')),
        //     ButtonSegment(value: 'gota', label: Text('gota')),
        //   ],
        //   selected: {concentrationSelected ?? ''},
        //   onSelectionChanged: (newSelection) {
        //     onConcentrationSelected( newSelection.first);
        //   },
        // ),
        // DropdownMenu<String>(
        //   dropdownMenuEntries: const [
        //     DropdownMenuEntry(value: 'mg', label: 'mg'),
        //     DropdownMenuEntry(value: 'ml', label: 'ml'),
        //     DropdownMenuEntry(value: 'gota', label: 'gota'),
        //   ],
        //   onSelected: onConcentrationSelected,
        // ),
      ],
    );
  }
}
