import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';

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

  // final TextEditingController controller = TextEditingController();
  final userCtrl = TextEditingController();
  final passCtrl = TextEditingController();
  bool obscure = true;

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

                // TODO Verificar esse ignore lint
                // ignore: use_build_context_synchronously
                context.goNamed(state.route);
              }
            } else if (state is LoginFailed) {
              ScaffoldMessenger.of(context)
                  .showSnackBar(SnackBar(content: Text(state.message)));
            }
          },
          builder: (blocCtx, state) {
            final bloc = blocCtx.read<LoginBloc>();
            if (state is LoginInitial) {
              bloc.add(LoginStarted());
            }
            // return Center(
            //   child: Column(
            //     mainAxisAlignment: MainAxisAlignment.center,
            //     children: [
            //       Text('Laços', style: displaySmall),
            //       SizedBox(
            //         height: 100,
            //         child: Image.asset(
            //           'assets/images/lacos-ico.png',
            //           fit: BoxFit.cover,
            //         ),
            //       ),
            //       const SizedBox(height: 60),
            //       Padding(
            //         padding: const EdgeInsets.all(10),
            //         child: Container(
            //           decoration: BoxDecoration(
            //             color: Colors.white,
            //             borderRadius: BorderRadius.circular(20),
            //             border: Border.all(color: CustomColor.backgroundPrimaryColor),
            //           ),
            //           padding: const EdgeInsets.only(top: 20, bottom: 20, right: 10, left: 10),
            //           child: Column(
            //             children: [
            //               Text('Entrar como', style: titleMedium),
            //               StatefulSegmentedButton<AccessProfileType>(
            //                 options: AccessProfileType.values,
            //                 getLabel: (value) => value.description,
            //                 getValue: (value) => value,
            //                 onChanged: (value) {
            //                   bloc.add(LoginAccessTypeSelected(value.first));
            //                 },
            //               ),
            //               const SizedBox(height: 12),
            //               switch (state.typeSelected) {
            //                 AccessProfileType.companion => ElevatedButton(
            //                     onPressed: () => bloc.add(LoginSignInWithGooglePressed()),
            //                     child: const Text('Login com conta Google'),
            //                   ),
            //                 AccessProfileType.patient => Column(
            //                     children: [
            //                       SizedBox(
            //                         width: 160,
            //                         child: TextField(
            //                           controller: controller,
            //                           decoration: const InputDecoration(
            //                             label: Text('Código'),
            //                           ),
            //                           maxLength: 6,
            //                           onTapOutside: (_) => FocusScope.of(context).unfocus(),
            //                           onSubmitted: (val) {
            //                             FocusScope.of(context).unfocus();
            //                             bloc.add(LoginSignInWithCode(val));
            //                           },
            //                         ),
            //                       ),
            //                       const SizedBox(height: 8),
            //                       FilledButton(
            //                         onPressed: () => bloc.add(LoginSignInWithCode(controller.text)),
            //                         child: const Text('Entrar'),
            //                       ),
            //                     ],
            //                   ),
            //               }
            //             ],
            //           ),
            //         ),
            //       ),
            //     ],
            //   ),
            // );
            // final cs = Theme.of(context).colorScheme;
            const margem = 16.0;

            void show(String what) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(what)),
              );
            }

            void onSignIn() {
              // Navegação provisória: substitua por sua rota/autenticação real
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Entrando...')),
              );
            }

            return Scaffold(
              body: SafeArea(
                child: Column(
                  children: [
                    Expanded(
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          SvgPicture.asset(
                            'assets/images/grafismo.svg',
                            fit: BoxFit.cover,
                          ),
                          Center(
                            child: SvgPicture.asset(
                              'assets/images/lacos.svg',
                              width: 140,
                              height: 140,
                            ),
                          ),
                        ],
                      )
                    ),
                    Padding(
                      padding: const EdgeInsets.all(margem),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _SocialButton(
                            label: 'Continuar com o Google',
                            asset: 'assets/images/google-logo.svg',
                            onTap: () => show('Google'),
                          ),

                          const SizedBox(height: 8),

                          _SocialButton(
                            label: 'Continuar com a Apple',
                            asset: 'assets/images/apple-logo.svg',
                            onTap: () => show('Apple'),
                          ),

                          const SizedBox(height: 16),

                          TextField(
                            controller: userCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Usuário',
                              prefixIcon: Icon(Icons.person_outline),
                              border: OutlineInputBorder(),
                            ),
                            textInputAction: TextInputAction.next,
                          ),

                          const SizedBox(height: 12),

                          TextField(
                            controller: passCtrl,
                            obscureText: obscure,
                            decoration: InputDecoration(
                              labelText: 'Senha',
                              prefixIcon: const Icon(Icons.lock_outline),
                              border: const OutlineInputBorder(),
                              suffixIcon: IconButton(
                                tooltip: 'visibilidade da senha', // espelha o title do HTML  :contentReference[oaicite:11]{index=11}
                                icon: Icon(
                                  obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                                ),
                                // TODO implementar aqui a ação do botão corretamente
                                onPressed: () => print('Clicou para mudar visibilidade da senha'),
                              ),
                            ),
                            onSubmitted: (_) => onSignIn(),
                          ),

                          const SizedBox(height: 32),

                          Row(
                            children: [
                              FilledButton( // Raised/primário
                                onPressed: onSignIn,
                                child: const Text('Entrar'),
                              ),

                              const SizedBox(height: 16),

                              TextButton(
                                onPressed: () => show('Esqueci minha senha'),
                                child: const Text('Esqueci minha senha'),
                              ),
                            ],
                          )
                        ],
                      ),
                    )
                  ],
                ),
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


// Componente Social Button
class _SocialButton extends StatelessWidget {
  final String label;
  final String asset;
  final VoidCallback onTap;

  const _SocialButton({
    required this.label,
    required this.asset,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 16), // padding semelhante ao CSS .social a  :contentReference[oaicite:13]{index=13}
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(6),
          // box-shadow + outline variant aproximados usando borda
          border: Border.all(color: cs.outlineVariant),
        ),
        child: Row(          
          children: [
            SizedBox(width: 20, height: 20, child: SvgPicture.asset(asset)),
            
            const SizedBox(width: 16),

            Expanded(
              child: Text(label, style: Theme.of(context).textTheme.bodyLarge),
            ),
          ],
        ),
      ),
    );
  }
}