part of 'login_bloc.dart';

@immutable
sealed class LoginEvent {}

class LoginStarted extends LoginEvent {}

class LoginSignWithGooglePressed extends LoginEvent {

}
