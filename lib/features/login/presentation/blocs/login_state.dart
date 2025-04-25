part of 'login_bloc.dart';

@immutable
sealed class LoginState {}

final class LoginInitial extends LoginState {}

final class LoginLoadInProgress extends LoginState {}

final class LoginReady extends LoginState {}

final class LoginSuccess extends LoginState {
}

final class LoginError extends LoginState {}
