import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'medication.dart';

class Prescription {
  final int id;
  final DateTime createdAt;
  final String doctorName;
  final String speciality;
  final DateTime? expireDate;
  final DateTime lastUpdate;
  final List<Medication> medications;
  final bool isActive;

  Prescription copyWith({
    int? id,
    DateTime? createdAt,
    String? doctorName,
    String? speciality,
    DateTime? expireDate,
    DateTime? lastUpdate,
    List<Medication>? medications,
    bool? isActive,
  }) {
    return Prescription(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      doctorName: doctorName ?? this.doctorName,
      speciality: speciality ?? this.speciality,
      expireDate: expireDate ?? this.expireDate,
      lastUpdate: lastUpdate ?? this.lastUpdate,
      medications: medications ?? this.medications,
      isActive: isActive ?? this.isActive,
    );
  }

  Widget buildTile({required VoidCallback onTap, Widget? trailing}) {
    return ListTile(
      title: Text(doctorName),
      subtitle: Text('$speciality - ${medications.length} medicações\n${DateFormat('dd/MM/yyyy', 'pt_BR').format(createdAt)}'),
      isThreeLine: true,
      contentPadding: const EdgeInsets.only(left: 10),
      trailing: trailing,
      onTap: onTap,
    );
  }

  Widget buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            const Text('Receita', textAlign: TextAlign.center),
            Text('Emitida em\n${DateFormat('dd/MM/yyyy', 'pt_BR').format(createdAt)}', textAlign: TextAlign.center),
          ],
        ),
        Text('Emitido por\n$doctorName', textAlign: TextAlign.center),
      ],
    );
  }

  Prescription.fromJson(Map<String, dynamic> json)
      : this(
          id: json['id'],
          createdAt: DateTime.parse(json['created_at']),
          doctorName: json['nome_medico'],
          speciality: json['especialidade'],
          medications: (json['medicacoes'] as List? ?? []).map((e) => Medication.fromJson(e)).toList(),
          isActive: json['ativa'] == 1 ? true : false,
          expireDate: DateTime.tryParse(json['expira_em']),
          lastUpdate: DateTime.parse(json['updated_at']),
        );

  Prescription({
    required this.id,
    required this.createdAt,
    required this.lastUpdate,
    required this.doctorName,
    required this.speciality,
    required this.medications,
    required this.isActive,
    this.expireDate,
  });
}
