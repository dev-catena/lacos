import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/user_cubit.dart';
import '../../../../core/routes.dart';
import '../../../../core/utils/custom_colors.dart';
import '../../../user_profile/presentation/widgets/screens/group_selection_screen.dart';
import '../../../home/domain/entities/patient_event.dart';
import '../../data/data_source/user_datasource.dart';

part '../../../home/presentation/widgets/components/patient_resume_card.dart';
part '../../presentation/widgets/components/patient_group_card.dart';

class User {
  final int id;
  final String fullName;
  final String photoPath;
  final bool isPatient;
  final List<AccessProfileType> accessProfileTypes;

  User({
    required this.id,
    required this.fullName,
    required this.isPatient,
    required this.photoPath,
    required this.accessProfileTypes,
  });
}
