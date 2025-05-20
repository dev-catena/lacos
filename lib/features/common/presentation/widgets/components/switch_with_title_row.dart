import 'package:flutter/material.dart';

class SwitchWithTitleRow extends StatefulWidget {
  const SwitchWithTitleRow(this.title, {this.switchValue = false, required this.onChanged, super.key});

  final String title;
  final void Function(bool value) onChanged;
  final bool switchValue;

  @override
  State<SwitchWithTitleRow> createState() => _SwitchWithTitleRowState();
}

class _SwitchWithTitleRowState extends State<SwitchWithTitleRow> {
  late bool realValue = widget.switchValue;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 20, right: 20, bottom: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(widget.title),
          Switch(
            value: realValue,
            onChanged: (value) {
              realValue = value;
              widget.onChanged(value);
              setState(() {});
            },
          ),
        ],
      ),
    );
  }
}
