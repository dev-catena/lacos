import 'package:flutter/material.dart';

import '../../../../../common/presentation/widgets/custom_scaffold.dart';

class PatientCollectableDataScreen extends StatelessWidget {
  const PatientCollectableDataScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final titleMedium = Theme.of(context).textTheme.titleMedium!;

    return CustomScaffold(
      child: Center(
        child: Column(
          children: [
            Text('Dados coletáveis', style: titleMedium),
            const SizedBox(height: 10),
            SwitchWithTitle('Pressão arterial', onChanged: (value) {}),
            SwitchWithTitle('Frequência cardiaca', onChanged: (value) {}),
            SwitchWithTitle('Saturação de oxigênio', onChanged: (value) {}),
            SwitchWithTitle('Glicemia', onChanged: (value) {}),
            SwitchWithTitle('Temperatura', onChanged: (value) {}),
            SwitchWithTitle('Frequência respiratória', onChanged: (value) {}),
            SwitchWithTitle('Localização', onChanged: (value) {}),
            const SizedBox(height: 30),
            Text('Funções para pessoa acompanhada', style: titleMedium, textAlign: TextAlign.center),
            const SizedBox(height: 10),
            SwitchWithTitle('Pressão arterial', onChanged: (value) {}),
            SwitchWithTitle('Frequência cardiaca', onChanged: (value) {}),
            SwitchWithTitle('Saturação de oxigênio', onChanged: (value) {}),
            SwitchWithTitle('Glicemia', onChanged: (value) {}),
            SwitchWithTitle('Temperatura', onChanged: (value) {}),
          ],
        ),
      ),
    );
  }
}

class SwitchWithTitle extends StatefulWidget {
  const SwitchWithTitle(this.title, {this.switchValue = false, required this.onChanged, super.key});

  final String title;
  final void Function(bool value) onChanged;
  final bool switchValue;

  @override
  State<SwitchWithTitle> createState() => _SwitchWithTitleState();
}

class _SwitchWithTitleState extends State<SwitchWithTitle> {
  late bool realValue = widget.switchValue;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 20, right: 20,bottom: 5),
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
