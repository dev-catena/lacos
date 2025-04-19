import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'core/routes.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {

  @override
  Widget build(BuildContext context) {
    return Center(
      child: FilledButton(
        onPressed: () => context.go(AppRoutes.homeScreen),
        child: const Text('Go home, boy'),
      ),
    );
  }
}
