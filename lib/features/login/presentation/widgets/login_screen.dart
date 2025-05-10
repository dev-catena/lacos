import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/providers/app_data_cubit.dart';
import '../../../../core/providers/patient_cubit.dart';
import '../../../../core/providers/user_cubit.dart';
import '../../../../core/routes.dart';
import '../../../../core/utils/custom_colors.dart';
import '../../../common/presentation/widgets/components/stateful_segmented_button.dart';
import '../../../user_profile/presentation/widgets/screens/group_selection_screen.dart';
import '../blocs/login_bloc.dart';

class LoginScreen extends StatelessWidget {
  LoginScreen({super.key});

  final TextEditingController controller = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final userData = context.read<UserCubit>();
    final appData = context.read<AppDataCubit>();
    final patientData = context.read<PatientCubit>();

    final displaySmall = Theme.of(context).textTheme.displaySmall!;
    final titleMedium = Theme.of(context).textTheme.titleMedium!;

    return Scaffold(
      body: BlocProvider(
        create: (context) => LoginBloc(userData),
        child: BlocConsumer<LoginBloc, LoginState>(
          listener: (context, state) async {
            if (state is LoginSuccess) {
              appData.initialize();

              if ((userData.state as UserReady).defaultPatient == null) {
                context.goNamed(AppRoutes.groupSelectionScreen);
              } else {
                await patientData.initialize(userData.currentPatient!);

                context.goNamed(state.route);
              }
            } else if (state is LoginFailed) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.message)));
            }
          },
          builder: (blocCtx, state) {
            final bloc = blocCtx.read<LoginBloc>();
            if (state is LoginInitial) {
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
                  const SizedBox(height: 60),
                  Padding(
                    padding: const EdgeInsets.all(10),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: CustomColor.backgroundPrimaryColor),
                      ),
                      padding: const EdgeInsets.only(top: 20, bottom: 20, right: 10, left: 10),
                      child: Column(
                        children: [
                          Text('Entrar como', style: titleMedium),
                          StatefulSegmentedButton<AccessProfileType>(
                            options: AccessProfileType.values,
                            getLabel: (value) => value.description,
                            getValue: (value) => value,
                            onChanged: (value) {
                              bloc.add(LoginAccessTypeSelected(value.first));
                            },
                          ),
                          const SizedBox(height: 12),
                          switch (state.typeSelected) {
                            AccessProfileType.companion => ElevatedButton(
                                onPressed: () => bloc.add(LoginSignInWithGooglePressed()),
                                child: const Text('Login com conta Google'),
                              ),
                            AccessProfileType.patient => Column(
                                children: [
                                  SizedBox(
                                    width: 160,
                                    child: TextField(
                                      controller: controller,
                                      decoration: const InputDecoration(
                                        label: Text('Código'),
                                      ),
                                      maxLength: 6,
                                      onTapOutside: (_) => FocusScope.of(context).unfocus(),
                                      onSubmitted: (val) {
                                        FocusScope.of(context).unfocus();
                                        bloc.add(LoginSignInWithCode(val));
                                      },
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  FilledButton(
                                    onPressed: () => bloc.add(LoginSignInWithCode(controller.text)),
                                    child: const Text('Entrar'),
                                  ),
                                ],
                              ),
                          }
                        ],
                      ),
                    ),
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
            color: CustomColor.activeColor,
          ),
        ),
        suffixIcon: trailingWidget,
      ),
      controller: controller,
    );
  }
}
