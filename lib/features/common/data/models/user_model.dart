import '../../../user_profile/presentation/widgets/screens/group_selection_screen.dart';
import '../../domain/entities/user.dart';

class UserModel extends UserEntity {
  UserModel.fromJson(Map<String, dynamic> json)
      : super(
          id: json['id'],
          fullName: json['nomeCompleto'],
          photoPath: json['caminhoFoto'],
          accessProfileTypes: AccessProfileType.fromIntList(json['perfisAcesso']),
    isPatient: json['paciente'] == 1 ? true : false,
        );

  UserModel({
    required super.id,
    required super.fullName,
    required super.photoPath,
    required super.accessProfileTypes,
    required super.isPatient,
    super.googleAccount,
  });

  UserEntity toEntity() {
    return UserEntity(
      id: id,
      fullName: fullName,
      photoPath: photoPath,
      accessProfileTypes: accessProfileTypes,
      googleAccount: googleAccount,
        isPatient: isPatient,
    );
  }
}
