import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/providers/patient_cubit.dart';
import '../../../../../core/routes.dart';
import '../../../../../core/utils/date_parser.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';
import '../../../../companion_home/domain/entities/patient_event.dart';

class AppointmentScheduleScreen extends StatelessWidget {
  const AppointmentScheduleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final titleMedium = Theme.of(context).textTheme.titleMedium!;

    return CustomScaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          context.pushNamed(AppRoutes.newAppointmentScreen);
        },
        child: const Icon(Icons.add),
      ),
      child: BlocBuilder<PatientCubit, PatientState>(
        builder: (context, state) {
          if (state is PatientReady) {
            final parser = DateParser<PatientEvent>(
              data: state.appointments.map((e) => e.toGenericEvent()).toList(),
              getDate: (event) => event.dateTime ?? DateTime.now(),
            );

            final grouped = parser.groupByDate();

            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Agenda de consultas', style: titleMedium, textAlign: TextAlign.start),
                ...List.generate(grouped.length, (index) {
                  final group = grouped[index];

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(group.date, textAlign: TextAlign.start),
                      ...group.values.map((event) {
                        return event.buildTile();
                      }),
                      const SizedBox(height: 28),
                    ],
                  );
                }),
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
