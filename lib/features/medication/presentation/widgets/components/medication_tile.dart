import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../common/presentation/widgets/components/custom_selectable_tile.dart';
import '../../../domain/entities/medication.dart';

class MedicationTile extends StatefulWidget {
  const MedicationTile(this.medication, {required this.onTap, this.trailing, super.key});

  final Medication medication;
  final VoidCallback onTap;
  final Widget? trailing;

  @override
  State<MedicationTile> createState() => _MedicationTileState();
}

class _MedicationTileState extends State<MedicationTile> {
  late Medication med = widget.medication;
  TimeOfDay? timeTaken;

  @override
  Widget build(BuildContext context) {
    // return Text(medicine.name);
    // final times = med.getSuggestedTimes();

    Color getStatusColor() {
      final Color color;

      if (med.hasTaken) {
        color = Colors.green.shade200;
      } else if (!med.hasTaken) {
        // color = CustomColor.vividRed;
        color = Colors.transparent;
      } else {
        color = Colors.transparent;
      }
      return color;
    }

    Color getBorderColor() {
      final Color color;

      if (med.hasTaken) {
        color = Colors.green.shade200;
      } else {
        // color = CustomColor.vividRed;
        color = Colors.grey;
      }

      return color;
    }

    final borderRadius = BorderRadius.circular(50);

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: borderRadius,
          // onTap: widget.onTap,
          onTap: () {
            showDialog(
              context: context,
              builder: (context) {
                return AlertDialog(
                  title: const Text(
                    'Informe o horário de administração do medicamento',
                    textAlign: TextAlign.center,
                  ),
                  contentPadding: const EdgeInsets.all(20),
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CustomSelectableTile(
                        title: timeTaken != null
                            ? '${timeTaken!.hour.toString().padLeft(2, '0')}:${timeTaken!.minute.toString().padLeft(2, '0')}'
                            : 'Horário',
                        onTap: () {
                          showTimePicker(
                            context: context,
                            initialTime: TimeOfDay.now(),
                          ).then((value) {
                            timeTaken = value;

                            debugPrint('$value');
                            setState(() {});
                          });
                        },
                        isActive: timeTaken != null,
                      ),
                    ],
                  ),
                  actionsAlignment: MainAxisAlignment.spaceAround,
                  actions: [
                    OutlinedButton(
                      onPressed: () {
                        context.pop();
                      },
                      child: const Text('Cancelar'),
                    ),
                    FilledButton(
                      onPressed: () {
                        med = med.copyWith(hasTaken: true);
                        setState(() {});
                        context.pop();
                      },
                      child: const Text('Confirmar'),
                    ),
                  ],
                );
              },
            );
            // med = med.copyWith(hasTaken: true);
            // setState(() {});
          },
          child: Container(
            height: 45,
            width: 45,
            decoration: BoxDecoration(
                color: getStatusColor(), borderRadius: borderRadius, border: Border.all(color: getBorderColor())),
            child: Icon(med.medicine.type.icon, size: 25),
          ),
        ),
      ),
      title: Text(med.medicine.name),
      subtitle: Text('${med.dosage?.ceil()}${med.medicine.type.mgOrMl} '
          '${med.frequency.description.toLowerCase()}'),
      trailing: widget.trailing,
    );

    // return Padding(
    //   padding: const EdgeInsets.only(top: 8, bottom: 8),
    //   child: Row(
    //     children: [
    //       Container(
    //         height: 40,
    //         width: 40,
    //         decoration: BoxDecoration(
    //             color: getStatusColor(),
    //             borderRadius: BorderRadius.circular(50),
    //             border: Border.all(color: med.hasTaken == null ? Colors.grey : getStatusColor())),
    //         child: Icon(med.medicine.type.icon, size: 25),
    //       ),
    //       const SizedBox(width: 10),
    //       Text(med.medicine.name),
    //     ],
    //   ),
    // );
  }
}
