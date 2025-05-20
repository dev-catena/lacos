import 'package:flutter/material.dart';

import '../../../../../common/presentation/widgets/components/switch_with_title_row.dart';
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
            SwitchWithTitleRow('Pressão arterial', onChanged: (value) {}),
            SwitchWithTitleRow('Frequência cardiaca', onChanged: (value) {}),
            SwitchWithTitleRow('Saturação de oxigênio', onChanged: (value) {}),
            SwitchWithTitleRow('Glicemia', onChanged: (value) {}),
            SwitchWithTitleRow('Temperatura', onChanged: (value) {}),
            SwitchWithTitleRow('Frequência respiratória', onChanged: (value) {}),
            SwitchWithTitleRow('Localização', onChanged: (value) {}),
            const SizedBox(height: 30),
            Text('Funções para pessoa acompanhada', style: titleMedium, textAlign: TextAlign.center),
            const SizedBox(height: 10),
            SwitchWithTitleRow('Pressão arterial', onChanged: (value) {}),
            SwitchWithTitleRow('Frequência cardiaca', onChanged: (value) {}),
            SwitchWithTitleRow('Saturação de oxigênio', onChanged: (value) {}),
            SwitchWithTitleRow('Glicemia', onChanged: (value) {}),
            SwitchWithTitleRow('Temperatura', onChanged: (value) {}),
          ],
        ),
      ),
    );
  }
}
