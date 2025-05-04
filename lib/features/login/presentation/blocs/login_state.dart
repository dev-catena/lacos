part of 'login_bloc.dart';

@immutable
sealed class LoginState {
  final AccessProfileType typeSelected;

  const LoginState(this.typeSelected);
}

final class LoginInitial extends LoginState {
  const LoginInitial(super.typeSelected);
}

final class LoginReady extends LoginState {
  const LoginReady(super.typeSelected);
}

final class LoginSuccess extends LoginState {
  final String route;

  const LoginSuccess(super.typeSelected, this.route);
}

final class LoginFailed extends LoginState {
  final String message;

  const LoginFailed(super.typeSelected, this.message);
}

final class LoginError extends LoginState {
  const LoginError(super.typeSelected);
}
