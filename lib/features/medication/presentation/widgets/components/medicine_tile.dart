import 'package:flutter/material.dart';

import '../../../../../core/utils/custom_colors.dart';
import '../../../domain/entities/medicine.dart';

class MedicationTile extends StatelessWidget {
  const MedicationTile(this.medication, {super.key});

  final Medication medication;

  @override
  Widget build(BuildContext context) {
    // return Text(medicine.name);
    final times = medication.getSuggestedTimes();

    Color getStatusColor(){
      final Color color;
      if(medication.hasTaken == null){

        return Colors.transparent;
      } else if(medication.hasTaken!) {
        color = Colors.green;
      } else if(!medication.hasTaken!){
        color = CustomColor.vividRed;
      } else {
        color = Colors.transparent;
      }
      return color;
    }

    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 8),
      child: Row(
        children: [
          Container(
            height: 40,
            width: 40,
            decoration: BoxDecoration(
              color: getStatusColor(),
              borderRadius: BorderRadius.circular(50),
              border: Border.all(color: medication.hasTaken == null ? Colors.grey : getStatusColor())
            ),
            child: Icon(medication.medicine.type.icon, size: 25),
          ),
          const SizedBox(width: 10),
          Text(medication.medicine.name),
        ],
      ),
    );
  }
}
