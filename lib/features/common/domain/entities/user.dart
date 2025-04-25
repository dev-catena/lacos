import 'dart:ui';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../../core/providers/user_cubit.dart';
import '../../../../core/routes.dart';
import '../../../../core/utils/custom_colors.dart';
import '../../../user_profile/presentation/widgets/screens/group_selection_screen.dart';
import '../../../home/domain/entities/patient_event.dart';
import '../../data/data_source/user_datasource.dart';

part '../../../home/presentation/widgets/components/patient_resume_card.dart';
part '../../presentation/widgets/components/patient_group_card.dart';

class UserEntity {
  final int id;
  final String fullName;
  final String photoPath;
  final bool isPatient;
  final List<AccessProfileType> accessProfileTypes;
  final GoogleSignInAccount? googleAccount;

  UserEntity copyWith({
    int? id,
    String? fullName,
    String? photoPath,
    bool? isPatient,
    List<AccessProfileType>? accessProfileTypes,
    GoogleSignInAccount? googleAccount,
  }) {
    return UserEntity(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      photoPath: photoPath ?? this.photoPath,
      isPatient: isPatient ?? this.isPatient,
      accessProfileTypes: accessProfileTypes ?? this.accessProfileTypes,
      googleAccount: googleAccount ?? this.googleAccount,
    );
  }

  UserEntity({
    required this.id,
    required this.fullName,
    required this.isPatient,
    required this.photoPath,
    required this.accessProfileTypes,
    this.googleAccount,
  });
}
