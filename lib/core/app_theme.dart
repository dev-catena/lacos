import 'package:flutter/material.dart';

import 'utils/custom_colors.dart';

class AppTheme {
  ThemeData getAppTheme(BuildContext context) {
    return ThemeData(
      floatingActionButtonTheme: const FloatingActionButtonThemeData(backgroundColor: CustomColor.bottomBarBg),
      inputDecorationTheme: const InputDecorationTheme(
        border: OutlineInputBorder(),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.resolveWith<Color>((states) {
            if (states.contains(WidgetState.selected)) {
              return CustomColor.activeColor;
            } else {
              return Colors.transparent;
            }
          }),
        ),
      ),
      chipTheme: ChipThemeData(
        color: WidgetStateProperty.resolveWith<Color>((states) {
          if (states.contains(WidgetState.selected)) {
            return CustomColor.activeColor;
          } else {
            return Colors.transparent;
          }
        }),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: ButtonStyle(
          backgroundColor: WidgetStateProperty.all(const Color.fromARGB(255, 85, 117, 50)),
          foregroundColor: WidgetStateProperty.all(Colors.white),
        ),
      ),
      textButtonTheme: TextButtonThemeData(          
        style: ButtonStyle(
          foregroundColor: WidgetStateProperty.all(const Color.fromARGB(255, 85, 117, 50)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: ButtonStyle(
          foregroundColor: WidgetStateProperty.all(CustomColor.vividRed),
          side: WidgetStateProperty.all(const BorderSide(color: CustomColor.vividRed)),
        ),
      ),
      tabBarTheme: const TabBarTheme(
        labelColor: CustomColor.bottomBarIcon,
        indicatorColor: CustomColor.bottomBarIcon,
      ),
      textTheme: const TextTheme(
        bodyMedium:  TextStyle(
          fontFamily: 'NunitoVariable'
        ),
        bodyLarge: TextStyle(
          fontFamily: 'NunitoVariable'
        ),
        bodySmall:  TextStyle(
          fontFamily: 'NunitoVariable'
        ),
        displayLarge:  TextStyle(
          fontFamily: 'NunitoVariable'
        ),
        displayMedium:  TextStyle(
          fontFamily: 'NunitoVariable'
        ),
        displaySmall:  TextStyle(
          fontFamily: 'NunitoVariable'
        ),
        headlineLarge:  TextStyle(
          fontFamily: 'NunitoVariable'
        ),
        headlineMedium:  TextStyle(
          fontFamily: 'NunitoVariable'
        ),
        headlineSmall:  TextStyle(
          fontFamily: 'NunitoVariable'
        ),
        labelLarge:  TextStyle(
          fontFamily: 'NunitoVariable'
        ),
        labelMedium:  TextStyle(
          fontFamily: 'NunitoVariable'
        ),
        labelSmall:  TextStyle(
          fontFamily: 'NunitoVariable'
        ),
        titleLarge:  TextStyle(
          fontFamily: 'NunitoVariable'
        ),
        titleMedium:  TextStyle(
          fontFamily: 'NunitoVariable'
        ),
        titleSmall:  TextStyle(
          fontFamily: 'NunitoVariable'
        )
      )
    );
  }
}
