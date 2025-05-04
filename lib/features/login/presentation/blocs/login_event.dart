part of 'login_bloc.dart';

@immutable
sealed class LoginEvent {}

class LoginStarted extends LoginEvent {}

class LoginAccessTypeSelected extends LoginEvent {
  final AccessProfileType typeSelected;

  LoginAccessTypeSelected(this.typeSelected);
}

class LoginSignInWithGooglePressed extends LoginEvent {}

class LoginSignInWithCode extends LoginEvent {
  final String code;

  LoginSignInWithCode(this.code);
}
