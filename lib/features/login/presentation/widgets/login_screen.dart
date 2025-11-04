import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../../core/providers/app_data_cubit.dart';
import '../../../../core/providers/patient_cubit.dart';
import '../../../../core/providers/user_cubit.dart';
import '../../../../core/routes.dart';
import '../blocs/login_bloc.dart';
import 'social_button.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userData = context.read<UserCubit>();
    final appData = context.read<AppDataCubit>();
    final patientData = context.read<PatientCubit>();

    final userCtrl = TextEditingController();
    final passCtrl = TextEditingController();
    const bool obscure = true;

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

            void show(String what) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(what)),
              );
            }

            void onSignIn() {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Entrando...')),
              );
            }

            Expanded fundoDaPagina() {
              return Expanded(
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    SvgPicture.asset(
                      'assets/images/grafismo.svg',
                      fit: BoxFit.cover,
                      colorFilter: const ColorFilter.mode(
                        Color.fromRGBO(168, 196, 136, 1),
                        BlendMode.srcATop
                      ),
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
              );
            }

            SocialButton logarComGoogle() {
              return SocialButton(
                label: 'Continuar com o Google',
                asset: 'assets/images/google-logo.svg',
                onTap: () => show('Google'),
              );
            }

            SocialButton logarComApple() {
              return SocialButton(
                label: 'Continuar com a Apple',
                asset: 'assets/images/apple-logo.svg',
                onTap: () => show('Apple'),
              );
            }

            TextField campoUsuario() {
              return TextField(
                controller: userCtrl,
                decoration: const InputDecoration(
                  labelText: 'Usuário',
                  prefixIcon: Icon(Icons.person_outline),
                  border: OutlineInputBorder(),
                ),
                textInputAction: TextInputAction.next,
              );
            }

            TextField campoSenha() {
              return TextField(
                controller: passCtrl,
                obscureText: obscure,
                decoration: InputDecoration(
                   labelText: 'Senha',
                  prefixIcon: const Icon(Icons.lock_outline),
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    tooltip: 'visibilidade da senha', // espelha o title do HTML  :contentReference[oaicite:11]{index=11}
                    icon: const Icon(
                      obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    ),
                    // TODO implementar aqui a ação do botão corretamente
                    onPressed: () => print('Clicou para mudar visibilidade da senha'),
                  ),
                ),
                onSubmitted: (_) => onSignIn(),
              );
            }

            Row botoesDeAcao() {
              return Row(
                children: [
                  FilledButton(
                    onPressed: onSignIn,
                    child: const Text('Entrar'),
                  ),

                  const SizedBox(height: 16),

                    TextButton(
                    onPressed: () => show('Esqueci minha senha'),
                    child: const Text('Esqueci minha senha'),
                  ),
                ],
              );
            }

            return Container(
              decoration: const BoxDecoration(
                color: Color.fromRGBO(217, 231, 202, 1.0)
              ),
              child: Scaffold(
                backgroundColor: Colors.transparent,
                body: SafeArea(
                  child: Column(
                    children: [
                      fundoDaPagina(),
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            logarComGoogle(),
                            const SizedBox(height: 8),
                            logarComApple(),
                            const SizedBox(height: 16),
                            
                            campoUsuario(),
                            const SizedBox(height: 12),
                            campoSenha(),

                            const SizedBox(height: 32),

                            botoesDeAcao()
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}