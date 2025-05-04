import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'medication.dart';

class Prescription {
  final int id;
  final String code;
  final DateTime date;
  final String doctorName;
  final DateTime? expireDate;
  final List<Medication> medications;

  Prescription copyWith({
    int? id,
    String? code,
    DateTime? date,
    String? doctorName,
    DateTime? expireDate,
    List<Medication>? medications,
  }) {
    return Prescription(
      id: id ?? this.id,
      code: code ?? this.code,
      date: date ?? this.date,
      doctorName: doctorName ?? this.doctorName,
      expireDate: expireDate ?? this.expireDate,
      medications: medications ?? this.medications,
    );
  }

  Widget buildTile({required VoidCallback onTap, Widget? trailing}) {
    return ListTile(
      title: Text(doctorName),
      subtitle: Text('${DateFormat('dd/MM/yyyy', 'pt_BR').format(date)}\n${medications.length} medicações'),
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
            Text('Receita\n$code', textAlign: TextAlign.center),
            Text('Emitida em\n${DateFormat('dd/MM/yyyy', 'pt_BR').format(date)}', textAlign: TextAlign.center),
          ],
        ),
        Text('Emitido por\n$doctorName', textAlign: TextAlign.center),
      ],
    );
  }

  Prescription.fromJson(Map<String, dynamic> json)
      : this(
            id: json['id'],
            code: json['code'],
            date: DateTime.parse(json['created_at']),
            doctorName: json['nome_medico'],
            medications: (json['medicacoes'] as List? ?? []).map((e) => Medication.fromJson(e)).toList(),
            expireDate: DateTime.tryParse(json['expira_em']));

  Prescription({
    required this.id,
    required this.code,
    required this.date,
    required this.doctorName,
    required this.medications,
    this.expireDate,
  });
}
