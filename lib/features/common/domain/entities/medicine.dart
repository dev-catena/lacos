
import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:material_symbols_icons/material_symbols_icons.dart';

import '../../../../core/utils/custom_colors.dart';

class Medicine extends Equatable {
  final int id;
  final String name;
  final MedicineType type;
  final String description;
  final double concentration; // mg/ml por dose

  Medicine.fromJson(Map<String, dynamic> json)
      : this(
    id: json['id'],
    description: json['descricao'],
    name: json['nome'],
    concentration: double.parse(json['dosagem']),
    type: MedicineType.fromCode(json['tipo']),
  );

  const Medicine({
    required this.id,
    required this.name,
    required this.type,
    required this.description,
    required this.concentration,
  });

  @override
  List<Object?> get props => [id, name, type, description, concentration];

  @override
  String toString() {
    return 'Medicine(name: $name, type: $type, dosage: $concentration mg)';
  }
}

enum MedicineType {
  pill(1, 'Comprimido', 'comp', Symbols.pill), // Pílula/comprimido
  ointment(2, 'Pomada', 'mg', Icons.wash), // Pomada
  syrup(3, 'Xarope', 'ml', Symbols.glass_cup), // Xarope
  oralDrops(4, 'Gotas', 'gota', Icons.water_drop), // Gotas orais
  injection(5, 'Injeção', 'ml', Icons.vaccines); // Injeção

  final int code;
  final String description;
  final String mgOrMl;
  final IconData icon;

  factory MedicineType.fromCode(int code) {
    return MedicineType.values.firstWhere((element) => element.code == code);
  }

  const MedicineType(this.code, this.description, this.mgOrMl, this.icon);

  Widget buildIcon(void Function(MedicineType type) onTap, [bool isActive = false]) {
    return Column(
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(60),
            onTap: () => onTap(this),
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                  color: isActive ? CustomColor.activeColor : null,
                  borderRadius: BorderRadius.circular(60),
                  border: Border.all(color: Colors.grey.shade500)),
              child: Icon(icon),
            ),
          ),
        ),
        Text(description),
      ],
    );
  }
}