import 'package:flutter/material.dart';

import '../../../../../core/utils/custom_colors.dart';

class CustomSelectableTile extends StatelessWidget {
  const CustomSelectableTile({
    super.key,
    required this.title,
    required this.onTap,
    required this.isActive,
    this.width,
    this.height,
    this.trailingWidget,
    this.hasGreyBackground = false,
    this.titleColor,
    this.color,
    this.borderColor,
  });

  final String title;
  final double? width;
  final double? height;
  final void Function() onTap;
  final bool isActive;
  final bool hasGreyBackground;
  final Color? titleColor;
  final Color? color;
  final Color? borderColor;
  final Widget? trailingWidget;

  // Casos
  // possui ativo/inativo (portanto, com cor/transparente)
  //

  Color getTileColor() {
    if (isActive) {
      return CustomColor.activeBottomBarBgIcon;
    } else {
      if (hasGreyBackground) return Colors.grey;
      return Colors.transparent;
    }
  }

  Color? getTextColor() {
    if (isActive == true) {
      return Colors.white;
    } else {
      return null;
    }
  }

  Color getBorderColor() {
    if (isActive != null) {
      if (isActive!) {
        return CustomColor.activeBottomBarBgIcon;
      } else {
        if (hasGreyBackground) return Colors.grey;
        return Colors.grey;
      }
    }
    if (hasGreyBackground) return Colors.transparent;
    return Colors.transparent;
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Container(
          height: height ?? 45,
          width: width ?? 180,
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: color ?? getTileColor(),
            borderRadius: BorderRadius.circular(5),
            border: Border.all(
              color: borderColor ?? getBorderColor(),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: titleColor ?? getTextColor(),
                  ),
                ),
              ),
              trailingWidget != null ? trailingWidget! : const SizedBox(),
            ],
          ),
        ),
      ),
    );
  }
}
