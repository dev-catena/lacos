import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../../core/providers/app_data_cubit.dart';
import '../../../../../core/providers/user_cubit.dart';
import '../../../../../core/utils/custom_colors.dart';
import '../../../../common/domain/entities/medicine.dart';
import '../../../../common/presentation/widgets/components/custom_selectable_tile.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';
import '../../../../common/presentation/widgets/dialogs/single_select_dialog.dart';
import '../../../../companion_home/patient_profile/presentation/widgets/dialogs/new_medicine_dialog.dart';
import '../../../domain/entities/medication.dart';
import '../../../domain/entities/medication_schedule.dart';
import '../../../domain/entities/prescription.dart';
import '../../blocs/new_medicine/new_medication_bloc.dart';
import '../dialogs/select_dosage_dialog.dart';
import '../dialogs/select_frequency_schedule_dialog.dart';
import '../dialogs/set_treatment_duration_dialog.dart';

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

  String getScheduleLabel() {
    switch (state.scheduleType) {
      case null:
        return 'Não selecionado';
      case MedicationScheduleType.interval:
        return 'A cada ${state.scheduleValue} horas';
      case MedicationScheduleType.daily:
        return 'Todo dia às ${state.scheduleValue}';
      case MedicationScheduleType.weekly:
        return 'Toda ${state.scheduleValue}';
      case MedicationScheduleType.cyclicWeekly:
        return 'Tomar x semanas e x semanas sem tomar';
      case MedicationScheduleType.monthly:
        return 'X ao mês nos dias Y e Z';
    }
  }

  String getDurationLabel() {
    if (state.startDate == null) {
      return 'Selecione a duração';
    }

    if (state.isContinuous) {
      return 'Tratamento contínuo a partir de ${DateFormat('dd/MM/yyyy').format(state.startDate!)}';
    } else {
      return 'De ${DateFormat('dd/MM/yyyy').format(state.startDate!)} '
          'até ${DateFormat('dd/MM/yyyy').format(state.endDate!)}';
    }
  }

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
        const SizedBox(height: 20),
        Text('Tratamento', style: titleMedium),
        const SizedBox(height: 10),
        ListTile(
          title: const Text('Duração do tratamento'),
          subtitle: Text(getDurationLabel()),
          trailing: state.startDate == null
              ? const Icon(Icons.warning_amber, color: CustomColor.vividRed)
              : const Icon(Icons.edit_outlined),

          onTap: () {
            showDialog(
              context: context,
              builder: (context) {
                return SetTreatmentDurationDialog(
                  currentContinuousValue: state.isContinuous,
                  currentStart: state.startDate,
                  currentEnd: state.endDate,
                  onSet: (startDate, endDate, isContinuous) {
                    bloc.add(NewMedicationDurationSet(startDate, isContinuous, endDate));
                  },
                );
              },
            );
          },
        ),
        // const Text('Duração do tratamento'),
        // Row(
        //   mainAxisAlignment: MainAxisAlignment.center,
        //   children: [
        //     const Text('Tratamento contínuo?'),
        //     Checkbox(
        //       value: state.isContinuous,
        //       onChanged: (value) => bloc.add(NewMedicationContinuousSelected(value)),
        //     ),
        //   ],
        // ),
        // if (state.isContinuous)
        //   CustomSelectableTile(
        //     title: state.startDate != null ? DateFormat('dd/MM/y').format(state.startDate!) : 'Data de início',
        //     onTap: () {
        //       showDatePicker(
        //         context: context,
        //         firstDate: DateTime.now().subtract(const Duration(days: 90)),
        //         lastDate: DateTime.now().add(const Duration(days: 365)),
        //       ).then((value) {
        //         if(value == null) return;
        //
        //         bloc.add(NewMedication)
        //       },);
        //     },
        //     isActive: state.startDate != null,
        //   )
        // else
        //   CustomSelectableTile(
        //     title: 'Intervalo de tratamento',
        //     onTap: () {
        //       showDateRangePicker(
        //         context: context,
        //         firstDate: DateTime.now().subtract(const Duration(days: 90)),
        //         lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
        //       );
        //     },
        //     isActive: false,
        //   ),
        const SizedBox(height: 10),
        ListTile(
          title: const Text('Frequencia de uso'),
          subtitle: Text(getScheduleLabel()),
          trailing: state.scheduleType == null || state.scheduleValue == null
              ? const Icon(Icons.warning_amber, color: CustomColor.vividRed)
              : const Icon(Icons.edit_outlined),
          onTap: () {
            showDialog(
              context: context,
              builder: (context) {
                return SelectFrequencyScheduleDialog(
                  currentType: state.scheduleType,
                  currentValue: state.scheduleValue,
                  onConfirm: (type, value) {
                    debugPrint('$runtimeType - type $type, value $value');
                    bloc.add(NewMedicationIntervalSelected(type, value));
                  },
                );
              },
            );
          },
        ),
        const SizedBox(height: 10),
        ListTile(
          title: const Text('Dosagem'),
          subtitle: Text(
            state.dosageType != null ? '${state.dosageQuantity} ${state.dosageType}s' : 'Dosagem não selecionada',
          ),
          trailing: state.dosageType == null || state.dosageQuantity == null
              ? const Icon(Icons.warning_amber, color: CustomColor.vividRed)
              : const Icon(Icons.edit_outlined),
          onTap: () {
            showDialog(
              context: context,
              builder: (context) => SelectDosageDialog(
                currentDosageType: state.dosageType,
                currentDosageQuantity: state.dosageQuantity,
                onSet: (type, quantity) {
                  bloc.add(NewMedicationDosageSet(type, quantity));
                },
              ),
            );
          },
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
            if (index == state.instructions.length) {
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
                icon: const Icon(Icons.add_circle_outline, size: 30),
              );
            } else {
              final instruction = state.instructions[index];
              return instruction.buildTile(() => bloc.add(NewMedicationInstructionRemoved(instruction)));
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
