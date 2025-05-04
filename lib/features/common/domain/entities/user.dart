import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../../core/providers/user_cubit.dart';
import '../../../../core/routes.dart';
import '../../../../core/utils/custom_colors.dart';
import '../../../companion_home/domain/entities/patient_event.dart';
import '../../../user_profile/presentation/widgets/screens/group_selection_screen.dart';
import '../../data/data_source/user_datasource.dart';
import 'patient.dart';

part '../../../companion_home/presentation/widgets/components/patient_resume_card.dart';
part '../../presentation/widgets/components/patient_group_card.dart';

class UserEntity {
  final int id;
  final String fullName;
  final String photoPath;
  final List<AccessProfileType> accessProfileTypes;
  final GoogleSignInAccount? googleAccount;
  final bool isPatient;

  UserEntity copyWith({
    int? id,
    String? fullName,
    String? photoPath,
    List<AccessProfileType>? accessProfileTypes,
    GoogleSignInAccount? googleAccount,
    bool? isPatient,
  }) {
    return UserEntity(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      photoPath: photoPath ?? this.photoPath,
      accessProfileTypes: accessProfileTypes ?? this.accessProfileTypes,
      googleAccount: googleAccount ?? this.googleAccount,
      isPatient: isPatient ?? this.isPatient,
    );
  }

  UserEntity({
    required this.id,
    required this.fullName,
    required this.photoPath,
    required this.accessProfileTypes,
    required this.isPatient,
    this.googleAccount,
  });
}
