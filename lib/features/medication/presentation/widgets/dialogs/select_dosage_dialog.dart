import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/routes.dart';

class SelectDosageDialog extends StatefulWidget {
  const SelectDosageDialog({
    required this.currentDosageType,
    required this.currentDosageQuantity,
    required this.onSet,
    super.key,
  });

  final String? currentDosageType;
  final int? currentDosageQuantity;
  final void Function(String type, int quantity) onSet;

  @override
  State<SelectDosageDialog> createState() => _SelectDosageDialogState();
}

class _SelectDosageDialogState extends State<SelectDosageDialog> {
  late final TextEditingController quantityController;
  String? internDosageType;
  int? internDosageQuantity;

  @override
  void initState() {
    internDosageType = widget.currentDosageType;
    internDosageQuantity = widget.currentDosageQuantity;
    quantityController = TextEditingController(text: internDosageQuantity?.toString() ?? '');
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('$runtimeType - ${internDosageType == null}');

    return AlertDialog(
      title: const Text('Selecione a dosagem'),
      content: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 100,
            child: TextField(
              controller: quantityController,
              onEditingComplete: () => FocusScope.of(context).unfocus(),
              onTapOutside: (_) => FocusScope.of(context).unfocus(),
              onSubmitted: (_) => FocusScope.of(context).unfocus(),
              decoration: const InputDecoration(
                label: Text('Dosagem'),
              ),
              keyboardType: TextInputType.number,
              onChanged: (value) {
                if(value != '') {
                  internDosageQuantity = int.parse(value);
                }
              },
            ),
          ),
          const SizedBox(width: 10),
          DropdownButton<String>(
            value: internDosageType,
            hint: const Text('Selecione'),
            onChanged: (value) {
              internDosageType = value;
              FocusScope.of(context).unfocus();
              setState(() {});
            },
            items: const [
              DropdownMenuItem(value: 'Comprimido', child: Text('Comprimido')),
              DropdownMenuItem(value: 'gota', child: Text('gota')),
              DropdownMenuItem(value: 'ml', child: Text('ml')),
            ],
          ),
          // PopupMenuButton<String>(
          //
          //   onSelected: (value) {
          //     internDosageType = value;
          //     FocusScope.of(context).unfocus();
          //     setState(() {});
          //   },
          //   itemBuilder: (_) => [
          //     const PopupMenuItem(value: 'Comprimido', child: Text('Comprimido')),
          //     const PopupMenuItem(value: 'gota', child: Text('gota')),
          //     const PopupMenuItem(value: 'ml', child: Text('ml')),
          //   ],
          //   child: Row(
          //     children: [
          //       Text(internDosageType ?? 'Selecione'),
          //       const Icon(Icons.arrow_drop_down),
          //     ],
          //   ),
          // ),
        ],
      ),
      actions: [
        OutlinedButton(
          onPressed: () {
            context.pop();
          },
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () {
            if (quantityController.text == '' || internDosageType == null) return;
            widget.onSet(internDosageType!, int.parse(quantityController.text));
            context.pop();
          },
          child: const Text('Confirmar'),
        ),
      ],
    );
  }
}
