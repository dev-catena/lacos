import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../../core/providers/app_data_cubit.dart';
import '../../../../core/providers/patient_cubit.dart';
import '../../../../core/providers/user_cubit.dart';
import '../../../../core/routes.dart';
import '../../../../core/utils/custom_colors.dart';
import '../blocs/login_bloc.dart';

class LoginScreen extends StatelessWidget {
  LoginScreen({super.key});

  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  Future<UserCredential> signInWithGoogle() async {
    final GoogleSignInAccount? googleUser = await GoogleSignIn().signIn();

    final GoogleSignInAuthentication? googleAuth = await googleUser?.authentication;

    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth?.accessToken,
      idToken: googleAuth?.idToken,
    );

    return await FirebaseAuth.instance.signInWithCredential(credential);
  }

  @override
  Widget build(BuildContext context) {
    final userData = context.read<UserCubit>();
    final doctorData = context.read<PatientCubit>();
    final appData = context.read<AppDataCubit>();

    final displaySmall = Theme
        .of(context)
        .textTheme
        .displaySmall!;

    return Scaffold(
      body: BlocProvider(
        create: (context) => LoginBloc(userData),
        child: BlocConsumer<LoginBloc, LoginState>(
          listener: (context, state) async {
            if(state is LoginSuccess){
              if ((userData.state as UserReady).defaultPatient == null) {
                context.goNamed(AppRoutes.groupSelectionScreen);
              } else {
                await doctorData.initialize(userData.currentPatient!);
                context.goNamed('home');
              }
            }
          },
          builder: (blocCtx, state) {
            final bloc = blocCtx.read<LoginBloc>();
            if(state is LoginInitial){
              bloc.add(LoginStarted());
            }
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Laços', style: displaySmall),
                  SizedBox(
                    height: 100,
                    child: Image.asset(
                      'assets/images/lacos-ico.png',
                      fit: BoxFit.cover,
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: CustomColor.backgroundPrimaryColor),
                    ),
                    padding: const EdgeInsets.only(left: 40, right: 40),
                    child: Column(
                      children: [
                        ElevatedButton(
                          onPressed: () => bloc.add(LoginSignWithGooglePressed()),
                          child: const Text('Login com google'),
                        ),
                      ],
                    ),
                    // child: Column(
                    //   mainAxisSize: MainAxisSize.min,
                    //   children: [
                    //     const SizedBox(height: 20),
                    //     getTextField(
                    //       labelText: 'CPF',
                    //       hintText: '12345678900',
                    //       leadingIcon: Icons.person_outlined,
                    //       controller: emailController,
                    //     ),
                    //     const SizedBox(height: 20),
                    //     getTextField(
                    //         labelText: 'Senha',
                    //         hintText: '*****',
                    //         leadingIcon: Icons.lock_outline,
                    //         controller: passwordController),
                    //     const SizedBox(height: 20),
                    //     FilledButton(
                    //       onPressed: () async {
                    //
                    //         appData.initialize();
                    //         await userData.initialize('usuario', 'senha');
                    //         if ((userData.state as UserReady).defaultPatient == null) {
                    //           context.goNamed(AppRoutes.groupSelectionScreen);
                    //         } else {
                    //           await doctorData.initialize(userData.currentPatient!);
                    //           context.goNamed('home');
                    //         }
                    //       },
                    //       child: const Text('Login'),
                    //     ),
                    //     const SizedBox(height: 20),
                    //   ],
                    // ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  TextField getTextField({
    required String labelText,
    required String hintText,
    required IconData leadingIcon,
    required TextEditingController controller,
    Widget? trailingWidget,
  }) {
    return TextField(
      decoration: InputDecoration(
        prefixIcon: Icon(leadingIcon),
        labelText: labelText,
        hintText: hintText,
        focusedBorder: const UnderlineInputBorder(
          borderSide: BorderSide(
            color: CustomColor.activeBottomBarBgIcon,
          ),
        ),
        suffixIcon: trailingWidget,
      ),
      controller: controller,
    );
  }
}
