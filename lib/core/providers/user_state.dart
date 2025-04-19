part of 'user_cubit.dart';

abstract class UserState {}

class UserDataInitial extends UserState {}

class UserReady extends UserState {
  final User userLoggedIn;
  final List<Patient> patients;
  final Patient? defaultPatient;
  final AccessProfileType currentAccessType;

  UserReady(
    this.userLoggedIn,
    this.patients,
    this.defaultPatient,
    this.currentAccessType,
  );

  UserReady copyWith({
    User? userLoggedIn,
    List<Patient>? patients,
    Patient? defaultPatient,
    AccessProfileType? currentAccessType,
  }) {
    return UserReady(
      userLoggedIn ?? this.userLoggedIn,
      patients ?? this.patients,
      defaultPatient ?? this.defaultPatient,
      currentAccessType ?? this.currentAccessType,
    );
  }
}
