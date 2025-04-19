import 'package:flutter/material.dart';

import '../../../../../core/utils/custom_colors.dart';
import '../../../domain/entities/medicine.dart';

class MedicineTile extends StatelessWidget {
  const MedicineTile(this.medicine, {super.key});

  final Medicine medicine;

  @override
  Widget build(BuildContext context) {
    // return Text(medicine.name);
    final times = medicine.getSuggestedTimes();

    Color getStatusColor(){
      final Color color;
      if(medicine.hasTaken == null){

        return Colors.transparent;
      } else if(medicine.hasTaken!) {
        color = Colors.green;
      } else if(!medicine.hasTaken!){
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
              border: Border.all(color: medicine.hasTaken == null ? Colors.grey : getStatusColor())
            ),
            child: Icon(medicine.type.icon, size: 25),
          ),
          const SizedBox(width: 10),
          Text(medicine.name),
        ],
      ),
    );
  }
}
