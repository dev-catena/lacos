import 'dart:async';
import 'package:bloc/bloc.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../../core/providers/user_cubit.dart';

part 'login_event.dart';

part 'login_state.dart';

class LoginBloc extends Bloc<LoginEvent, LoginState> {
  final UserCubit userData;

  LoginBloc(this.userData) : super(LoginInitial()) {
    on<LoginStarted>(_onStarted);
    on<LoginSignWithGooglePressed>(_onSignInWithGoogle);
  }

  Future<GoogleSignInAccount> _signInWithGoogle() async {
    final isSignedIn = await _googleSignIn.isSignedIn();
    final GoogleSignInAccount? googleAccount;

    if (isSignedIn) {
      googleAccount = _googleSignIn.currentUser ?? await _googleSignIn.signInSilently();
    } else {
      googleAccount = await _googleSignIn.signIn();
    }


    return googleAccount!;
  }

  final GoogleSignIn _googleSignIn = GoogleSignIn();

  FutureOr<void> _onStarted(LoginStarted event, Emitter<LoginState> emit) async {
    final googleAccount = await _signInWithGoogle();

    await userData.initialize(googleAccount);

    emit(LoginSuccess());
  }

  Future<void> _onSignInWithGoogle(LoginSignWithGooglePressed event, Emitter<LoginState> emit) async {
    final userCredential = await _signInWithGoogle();

    await userData.initialize(userCredential);

    emit(LoginSuccess());
  }
}
