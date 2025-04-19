import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

class Doctor extends Equatable {
  final int id;
  final String name;
  final String speciality;
  final String crm;
  final String phoneNumber;
  final String email;
  final String address;

  Doctor copyWith({
    int? id,
    String? name,
    String? speciality,
    String? crm,
    String? phoneNumber,
    String? email,
    String? address,
  }) {
    return Doctor(
      id: id ?? this.id,
      name: name ?? this.name,
      speciality: speciality ?? this.speciality,
      crm: crm ?? this.crm,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      address: address ?? this.address,
    );
  }

  Map<String, dynamic> toRemote(){
    final data = {
      'nome': name,
      'especialidade': speciality,
      'crm': crm,
      'telefone': phoneNumber,
      'email': email,
      'endereco': address,
    };

    return data;
  }
  const Doctor({
    required this.id,
    required this.name,
    required this.speciality,
    required this.crm,
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
  List<Object?> get props => [id, name, crm];
}
