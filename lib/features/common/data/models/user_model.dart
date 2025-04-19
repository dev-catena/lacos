import '../../../user_profile/presentation/widgets/screens/group_selection_screen.dart';
import '../../domain/entities/user.dart';

class UserModel extends User {
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
  });

  User toEntity() {
    return User(
      id: id,
      fullName: fullName,
      isPatient: isPatient,
      photoPath: photoPath,
      accessProfileTypes: accessProfileTypes,
    );
  }
}
