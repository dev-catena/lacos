import 'package:collection/collection.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../features/common/data/data_source/user_datasource.dart';
import '../../features/common/domain/entities/user.dart';
import '../../features/medication/domain/entities/medication.dart';
import '../../features/user_profile/presentation/widgets/screens/group_selection_screen.dart';

part 'user_state.dart';

class UserCubit extends Cubit<UserState> {
  final UserDataSource _userDataSource;

  UserCubit(this._userDataSource) : super(UserDataInitial());

  UserEntity? get user => state is UserReady ? (state as UserReady).userLoggedIn : null;

  Patient? get currentPatient => state is UserReady ? (state as UserReady).defaultPatient : null;

  Patient? get currentAccessType => state is UserReady ? (state as UserReady).defaultPatient : null;

  Future<void> initialize(GoogleSignInAccount account) async {
    List<Patient> patients = [];
    int? defaultPatientId;
    AccessProfileType? accessType;

    final user = await _userDataSource.login(account);

    await Future.wait([
      _userDataSource.getPatientsForUser(user.id).then((value) => patients = value),
      _userDataSource.getDefaultPatient().then((value) => defaultPatientId = value),
      _userDataSource.getAccessType(user).then((value) => accessType = value),
    ]);

    final defaultPatient =
        defaultPatientId != null ? patients.firstWhereOrNull((p) => p.self.id == defaultPatientId) : null;

    emit(UserReady(user, patients, defaultPatient, accessType!));
  }

  Future<void> setDefaultPatient(int id) async {
    final currentState = state;
    if (currentState is UserReady) {
      await _userDataSource.setDefaultPatient(id);
      final newDefault = currentState.patients.firstWhereOrNull((p) => p.self.id == id);
      emit(currentState.copyWith(defaultPatient: newDefault));
    }
  }

  Future<void> setDefaultAccessType(AccessProfileType accessType) async {
    final currentState = state;
    if (currentState is UserReady) {
      await _userDataSource.setDefaultAccessType(accessType);
      emit(currentState.copyWith(currentAccessType: accessType));
    }
  }

  void addMedication(Medication med) {
    final currentState = state;
    if (currentState is UserReady) {
      emit(currentState.copyWith(defaultPatient: currentPatient!..medications.add(med)));
    }
  }

  void clear() => emit(UserDataInitial());
}
