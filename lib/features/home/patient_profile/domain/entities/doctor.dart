import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

class Doctor extends Equatable {
  final int id;
  final String name;
  final String speciality;
  final String CRM;
  final String phoneNumber;
  final String email;
  final String address;

  const Doctor({
    required this.id,
    required this.name,
    required this.speciality,
    required this.CRM,
    required this.phoneNumber,
    required this.email,
    required this.address,
  });

  Widget buildTile() {
    return Padding(
      padding: const EdgeInsets.only(top: 10, bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          CircleAvatar(
            child: Text(name[0]),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(name),
                    Text(speciality),
                  ],
                ),
                const SizedBox(height: 7),
                Text(address),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  List<Object?> get props => [id, name, CRM];
}
