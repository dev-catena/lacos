import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/providers/patient_cubit.dart';
import '../../../../../core/providers/user_cubit.dart';
import '../../../../../core/routes.dart';
import '../../../../common/presentation/widgets/custom_scaffold.dart';
import '../dialogs/copy_prescription_dialog.dart';
import '../dialogs/new_prescription_dialog.dart';

class PrescriptionPanelScreen extends StatefulWidget {
  const PrescriptionPanelScreen({super.key});

  @override
  State<PrescriptionPanelScreen> createState() => _PrescriptionPanelScreenState();
}

class _PrescriptionPanelScreenState extends State<PrescriptionPanelScreen> {
  @override
  Widget build(BuildContext context) {
    final titleMedium = Theme.of(context).textTheme.titleMedium!;
    final appData = context.read<UserCubit>();
    final patientData = context.watch<PatientCubit>();
    final activePrescriptions = patientData.prescriptions.where((element) => element.isActive).toList();

    return CustomScaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          showDialog(
              context: context,
              builder: (context) {
                return NewPrescriptionDialog(onConfirm: (newPrescription) async {
                  await patientData.registerPrescription(appData.currentPatient!, newPrescription);
                  setState(() {});
                });
              });
        },
        child: const Icon(Icons.add),
      ),
      child: Column(
        children: [
          Text('Receitas', style: titleMedium, textAlign: TextAlign.center),
          const ListTile(
            title: Text('Medicações sem receita'),
            subtitle: Text('x medicações'),
          ),
          const SizedBox(height: 12),
          const Divider(),
          const SizedBox(height: 12),
          ...List.generate(
            activePrescriptions.length,
            (index) {
              final pres = activePrescriptions[index];

              if (activePrescriptions.isEmpty) {
                return const Text('Nenhuma prescrição cadastrada');
              }

              return pres.buildTile(
                trailing: PopupMenuButton<String>(
                  onSelected: (value) async {
                    if (value == 'edit') {
                      showDialog(
                          context: context,
                          builder: (context) {
                            return CopyPrescriptionDialog(pres, onCreated: (newPrescription) async {
                              await patientData.registerPrescription(appData.currentPatient!, newPrescription);

                              await patientData.deactivatePrescription(appData.currentPatient!, pres);
                              setState(() {});
                            });
                          });
                    } else if (value == 'delete') {
                      await patientData.deactivatePrescription(appData.currentPatient!, pres);
                      setState(() {});
                    }
                  },
                  itemBuilder: (context) => const [
                    PopupMenuItem(value: 'edit', child: Text('Copiar')),
                    PopupMenuItem(value: 'delete', child: Text('Descontinuar')),
                  ],
                  // Hide the default icon
                  icon: const Icon(Icons.settings),
                ),
                onTap: () {
                  context.pushNamed(AppRoutes.prescriptionMedicationsScreen, extra: pres);
                },
              );
            },
          ),
        ],
      ),
    );
  }
}

// import 'package:flutter/material.dart';
// import 'package:flutter_bloc/flutter_bloc.dart';
// import 'package:go_router/go_router.dart';
//
// import '../../../../../core/routes.dart';
// import '../../../../common/presentation/widgets/custom_scaffold.dart';
// import '../../../data/prescription_datasource.dart';
// import '../../../domain/entities/prescription.dart';
// import '../../blocs/prescription_bloc.dart';
// import '../dialogs/copy_prescription_dialog.dart';
// import '../dialogs/new_prescription_dialog.dart';
//
// class PrescriptionPanelScreen extends StatelessWidget {
//   const PrescriptionPanelScreen({super.key});
//
//   @override
//   Widget build(BuildContext context) {
//     return BlocProvider(
//       create: (_) => PrescriptionBloc(PrescriptionDataSource()),
//       child: CustomScaffold(
//         floatingActionButton: BlocBuilder<PrescriptionBloc, PrescriptionState>(
//           builder: (context, state) {
//             if (state is PrescriptionReady) {
//               return FloatingActionButton(
//                 onPressed: () {
//                   showDialog(
//                       context: context,
//                       builder: (context) {
//                         return NewPrescriptionDialog(onConfirm: (newPrescription) {});
//                       });
//                 },
//                 child: const Icon(Icons.add),
//               );
//             } else {
//               return const SizedBox.shrink();
//             }
//           },
//         ),
//         child: BlocBuilder<PrescriptionBloc, PrescriptionState>(
//           builder: (blocCtx, state) {
//             final bloc = blocCtx.read<PrescriptionBloc>();
//             switch (state) {
//               case PrescriptionInitial():
//                 bloc.add(PrescriptionStarted());
//                 return const CircularProgressIndicator();
//               case PrescriptionLoadInProgress():
//                 return const CircularProgressIndicator();
//               case PrescriptionReady():
//                 return _ReadyScreen(state);
//               case PrescriptionError():
//                 return Column(
//                   children: [
//                     const Text('Erro'),
//                     IconButton(
//                       onPressed: () => bloc.add(PrescriptionStarted()),
//                       icon: const Icon(Icons.refresh_outlined),
//                     ),
//                   ],
//                 );
//               default:
//                 return Column(
//                   children: [
//                     const Text('Sem state'),
//                     IconButton(
//                       onPressed: () => bloc.add(PrescriptionStarted()),
//                       icon: const Icon(Icons.refresh_outlined),
//                     ),
//                   ],
//                 );
//             }
//           },
//         ),
//       ),
//     );
//   }
// }
//
// class _ReadyScreen extends StatelessWidget {
//   const _ReadyScreen(this.state);
//
//   final PrescriptionReady state;
//
//   @override
//   Widget build(BuildContext context) {
//     final titleMedium = Theme.of(context).textTheme.titleMedium!;
//     final bloc = context.read<PrescriptionBloc>();
//
//     return Column(
//       children: [
//         Text('Receitas', style: titleMedium, textAlign: TextAlign.center),
//         const ListTile(
//           title: Text('Medicações sem receita'),
//           subtitle: Text('x medicações'),
//         ),
//         const SizedBox(height: 12),
//         const Divider(),
//         const SizedBox(height: 12),
//         ...List.generate(
//           state.prescriptions.length,
//           (index) {
//             final pres = state.prescriptions[index];
//
//             if (state.prescriptions.isEmpty) {
//               return const Text('Nenhuma prescrição cadastrada');
//             }
//
//             return pres.buildTile(
//               trailing: PopupMenuButton<String>(
//                 onSelected: (value) {
//                   if (value == 'edit') {
//                     showDialog(
//                         context: context,
//                         builder: (context) {
//                           return CopyPrescriptionDialog(pres, onCreated: (newPrescription) {
//                             bloc.add(PrescriptionRegistered(newPrescription));
//                           });
//                         });
//                   } else if (value == 'delete') {
//
//                   }
//                 },
//                 itemBuilder: (context) => const [
//                   PopupMenuItem(value: 'edit', child: Text('Copiar')),
//                   PopupMenuItem(value: 'delete', child: Text('Desativar')),
//                 ],
//                 // Hide the default icon
//                 icon: const Icon(Icons.settings),
//               ),
//               onTap: () {
//                 context.pushNamed(AppRoutes.prescriptionMedicationsScreen, extra: pres);
//               },
//             );
//           },
//         ),
//       ],
//     );
//   }
// }
