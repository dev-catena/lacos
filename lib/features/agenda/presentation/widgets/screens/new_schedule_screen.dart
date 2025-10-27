import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/providers/patient_cubit.dart';
import '../../../../../core/utils/custom_colors.dart';
import '../../../../common/presentation/widgets/components/custom_selectable_tile.dart';
import '../../../../common/presentation/widgets/components/switch_with_title_row.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';
import '../../../../common/presentation/widgets/dialogs/single_select_dialog.dart';
import '../../../../companion_home/patient_profile/domain/entities/doctor.dart';
import '../../../../common/presentation/widgets/components/schedule_component.dart';
import '../../../entities/agenda_appointment.dart';

class NewScheduleScreen extends StatefulWidget {
  const NewScheduleScreen({super.key});

  @override
  State<NewScheduleScreen> createState() => _NewScheduleScreenState();
}

class _NewScheduleScreenState extends State<NewScheduleScreen> {
  final descriptionController = TextEditingController();
  bool isMedical = false;
  bool isRecurrent = false;
  Doctor? doctorSelected;
  DateTime? dateSelected;
  TimeOfDay? timeSelected;

  void setDoctor(Doctor value) {
    if (doctorSelected == value) {
      doctorSelected = null;
    } else {
      doctorSelected = value;
    }
    setState(() {});
  }

  void setDate(DateTime? date) {
    if (date == null) return;
    dateSelected = date;
    setState(() {});
  }

  void setTime(TimeOfDay? time) {
    if (time == null) return;
    timeSelected = time;
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final patientCubit = context.read<PatientCubit>();

    final bool isDoctorSelected = doctorSelected != null;
    final bool isDateSelected = dateSelected != null;
    final bool isTimeSelected = timeSelected != null;
    final bool canRegister = dateSelected != null && timeSelected != null && descriptionController.text != '';

    final titleLarge = Theme.of(context).textTheme.titleLarge!;
    final titleMedium = Theme.of(context).textTheme.titleMedium!;

    return CustomScaffold(
      child: BlocBuilder<PatientCubit, PatientState>(
        builder: (context, blocState) {
          if (blocState is PatientReady) {
            return Column(
              children: [
                Text('Agendamento de compromisso', style: titleLarge),
                const SizedBox(height: 12),
                TextField(
                  controller: descriptionController,
                  onTapOutside: (_) {
                    FocusScope.of(context).unfocus();
                    setState(() {});
                  },
                  onSubmitted: (_) => FocusScope.of(context).unfocus(),
                  onEditingComplete: () => FocusScope.of(context).unfocus(),
                  onChanged: (value) {
                    if (value.length <= 1) {
                      setState(() {});
                    }
                  },
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: 'Descrição',
                  ),
                ),
                const SizedBox(height: 12),
                Text('Data e hora', style: titleMedium),
                const SizedBox(height: 12),
                // CalendarDatePicker(
                //   currentDate: dateSelected,
                //   initialDate: DateTime.now(),
                //   firstDate: DateTime.now(),
                //   lastDate: DateTime.now().add(const Duration(days: 365)),
                //   onDateChanged: setDate,
                // ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CustomSelectableTile(
                      leadingWidget: Icon(Icons.calendar_month_outlined, color: isDateSelected ? Colors.white : null),
                      title: isDateSelected ? dateSelected!.toLocal().toString().split(' ')[0] : 'Data',
                      onTap: () {
                        showDatePicker(
                          context: context,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                        ).then(setDate);
                      },
                      isActive: isDateSelected,
                    ),
                    const SizedBox(width: 12),
                    CustomSelectableTile(
                      leadingWidget: Icon(Icons.access_time_outlined, color: isTimeSelected ? Colors.white : null),
                      title: isTimeSelected
                          ? '${timeSelected!.hour.toString().padLeft(2, '0')}:${timeSelected!.minute.toString().padLeft(2, '0')}'
                          : 'Horário',
                      width: 100,
                      onTap: () {
                        showTimePicker(context: context, initialTime: TimeOfDay.now()).then(setTime);
                      },
                      isActive: isTimeSelected,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SwitchWithTitleRow(
                  'Compromisso recorrente?',
                  onChanged: (value) {
                    isRecurrent = value;
                    // if (!value) doctorSelected = null;
                    setState(() {});
                  },
                ),
                if (isRecurrent)
                  ScheduleComponent(
                    currentType: null,
                    currentValue: null,
                    onTypeSet: (value) {},
                    onValueSet: (value) {},
                  ),
                SwitchWithTitleRow(
                  'Compromisso médico?',
                  onChanged: (value) {
                    isMedical = value;
                    if (!value) doctorSelected = null;
                    setState(() {});
                  },
                ),
                if (isMedical)
                  CustomSelectableTile(
                    title: doctorSelected?.name ?? 'Médico',
                    isActive: isDoctorSelected,
                    onTap: () {
                      showDialog(
                        context: context,
                        builder: (context) {
                          return SingleSelectDialog<Doctor>(
                            title: 'Selecione o médico',
                            options: blocState.doctors,
                            getName: (option) => '${option.name}\n${option.speciality}',
                            onChoose: setDoctor,
                            optionSelected: doctorSelected,
                          );
                        },
                      );
                    },
                  ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () async {
                    if (!canRegister) return;

                    final AgendaAppointment event = AgendaAppointment(
                      id: 0,
                      scheduledTo: dateSelected!,
                      description: descriptionController.text,
                      doctor: doctorSelected,
                    );

                    await patientCubit.registerAppointment(event);
                    // TODO Verificar esse ignore lint
                    // ignore: use_build_context_synchronously
                    context.pop();
                  },
                  style: ButtonStyle(
                    backgroundColor: WidgetStatePropertyAll(!canRegister ? CustomColor.deactivatedButton : null),
                  ),
                  child: const Text('Cadastrar'),
                ),
                const SizedBox(height: 12),
              ],
            );
          } else {
            return const CircularProgressIndicator();
          }
        },
      ),
    );
  }
}
