import 'dart:async';
import 'package:bloc/bloc.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../../core/providers/user_cubit.dart';
import '../../../user_profile/presentation/widgets/screens/group_selection_screen.dart';

part 'login_event.dart';

part 'login_state.dart';

class LoginBloc extends Bloc<LoginEvent, LoginState> {
  final UserCubit userData;

  LoginBloc(this.userData) : super(LoginInitial(AccessProfileType.values.first)) {
    on<LoginStarted>(_onStarted);
    on<LoginSignInWithGooglePressed>(_onSignInWithGoogle);
    on<LoginAccessTypeSelected>(_onAccessTypeSelected);
    on<LoginSignInWithCode>(_onSignInWithCode);
  }

  final GoogleSignIn _googleSignIn = GoogleSignIn();

  Future<bool> _signInWithGoogle() async {
    final isSignedIn = await _googleSignIn.isSignedIn();
    final GoogleSignInAccount? googleAccount;

    if (isSignedIn) {
      googleAccount = _googleSignIn.currentUser ?? await _googleSignIn.signInSilently();
    } else {
      googleAccount = await _googleSignIn.signIn();
    }

    if (googleAccount != null) {
      await userData.initialize(googleAccount);
    }
    return googleAccount != null;
  }

  Future<void> _onStarted(LoginStarted event, Emitter<LoginState> emit) async {

    emit(LoginReady(state.typeSelected));
  }


  Future<void> _onSignInWithGoogle(LoginSignInWithGooglePressed event, Emitter<LoginState> emit) async {
    final loggedIn = await _signInWithGoogle();

    if (loggedIn) {
      emit(LoginSuccess(state.typeSelected, 'home'));
    } else {
      emit(LoginFailed(state.typeSelected, 'Não foi possível logar com conta google!'));
    }
  }

  void _onAccessTypeSelected(LoginAccessTypeSelected event, Emitter<LoginState> emit) {

    emit(LoginReady(event.typeSelected));
  }

  Future<void> _onSignInWithCode(LoginSignInWithCode event, Emitter<LoginState> emit) async {
    if(event.code == '1'){

      final GoogleSignInAccount? googleAccount = _googleSignIn.currentUser ?? await _googleSignIn.signInSilently();

      await userData.initialize(googleAccount!);
      emit(LoginSuccess(state.typeSelected, 'patient-home'));
    } else {
      emit(LoginFailed(state.typeSelected, 'Código incorreto'));
    }
  }
}
