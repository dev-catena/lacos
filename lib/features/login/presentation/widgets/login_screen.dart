import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/patient_cubit.dart';
import '../../../../core/routes.dart';
import '../../../../core/providers/user_cubit.dart';
import '../../../../core/utils/custom_colors.dart';

class LoginScreen extends StatelessWidget {
  LoginScreen({super.key});

  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final displaySmall = Theme.of(context).textTheme.displaySmall!;

    return Scaffold(
      body: Center(
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
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 20),
                  getTextField(
                    labelText: 'CPF',
                    hintText: '12345678900',
                    leadingIcon: Icons.person_outlined,
                    controller: emailController,
                    // onChanged: (value) => context.read<LoginBloc>().add(PasswordChanged(value)),
                  ),
                  const SizedBox(height: 20),
                  getTextField(
                      labelText: 'Senha',
                      hintText: '*****',
                      leadingIcon: Icons.lock_outline,
                      controller: passwordController),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: () async {
                      final userData = context.read<UserCubit>();
                      final doctorData = context.read<PatientCubit>();

                      await userData.initialize('usuario', 'senha');
                      if ((userData.state as UserReady).defaultPatient == null) {
                        context.goNamed(AppRoutes.groupSelectionScreen);
                      } else {
                        await doctorData.initialize(userData.currentPatient!);
                        context.goNamed('home');
                      }
                    },
                    child: const Text('Login'),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
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
