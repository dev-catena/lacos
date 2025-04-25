import 'package:firebase_auth/firebase_auth.dart';

import '../../../user_profile/presentation/widgets/screens/group_selection_screen.dart';
import '../../domain/entities/user.dart';

class UserModel extends UserEntity {
  UserModel.fromJson(Map<String, dynamic> json)
      : super(
          id: json['id'],
          fullName: json['nomeCompleto'],
          isPatient: json['paciente'] == 1 ? true : false,
          photoPath: json['caminhoFoto'],
          accessProfileTypes: AccessProfileType.fromIntList(json['perfisAcesso']),
        );

  UserModel({
    required super.id,
    required super.fullName,
    required super.isPatient,
    required super.photoPath,
    required super.accessProfileTypes,
    super.googleAccount,
  });

  UserEntity toEntity() {
    return UserEntity(
      id: id,
      fullName: fullName,
      isPatient: isPatient,
      photoPath: photoPath,
      accessProfileTypes: accessProfileTypes,
      googleAccount: googleAccount,
    );
  }
}
