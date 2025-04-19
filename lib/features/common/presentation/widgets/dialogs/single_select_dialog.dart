import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../components/custom_selectable_tile.dart';

/// Caixa de diálogo genérica que disponibiliza ao usuário selecionar uma opção e retorna a opção escolhida
/// pelo callback de [onChoose].
///
/// É necessário especificar o tipo de dado do diálogo na sua instanciação, por ex.:
///
/// ```dart
/// SingleOptionDialog<UserEntity>(
///     title: 'Selecione um responsável',
///     options: state.availableMembers,
///     getName: (option) => option.name,
///     onChoose: (member) => bloc.add(ManageTeamComponentMemberAdded(member)),
///     optionSelected: state.userSelected,
///   );
/// });
/// ```
class SingleSelectDialog<T> extends StatefulWidget {
  const SingleSelectDialog({
    super.key,
    required this.title,
    required this.options,
    required this.getName,
    required this.onChoose,
    required this.optionSelected,
    this.trailingWidget,
  });

  final String title;
  final List<T> options;
  final String Function(T option) getName; // Function to extract name from option
  final T? optionSelected;
  final void Function(T value) onChoose;
  final Widget? Function(T value)? trailingWidget;

  @override
  State<SingleSelectDialog> createState() => _SingleSelectDialogState<T>();
}

class _SingleSelectDialogState<T> extends State<SingleSelectDialog<T>> {
  late List<T> filteredOptions;

  @override
  void initState() {
    filteredOptions = widget.options;
    super.initState();
  }

  void _filterOptionsBySearchText(String searchText) {
    setState(() {
      filteredOptions = widget.options
          .where((option) => widget.getName(option).toLowerCase().contains(searchText.toLowerCase()))
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final Size size = MediaQuery.of(context).size;

    return SimpleDialog(
      title: Text(widget.title),
      children: [
        Padding(
          padding: const EdgeInsets.all(15),
          child: SearchBar(
            hintText: 'Pesquise pelo nome',
            onChanged: _filterOptionsBySearchText,
          ),
        ),
        const Divider(
          endIndent: 15,
          indent: 15,
        ),
        SizedBox(
          width: size.width * 0.3,
          height: 300,
          child: widget.options.isEmpty
              ? const Center(child: Text('Nenhuma opção disponível', textAlign: TextAlign.center))
              : ListView.separated(
                  itemCount: filteredOptions.length,
                  separatorBuilder: (_, __) => const Divider(height: 10),
                  padding: const EdgeInsets.all(20),
                  itemBuilder: (context, index) {
                    final option = filteredOptions[index];
                    final isActive = option == widget.optionSelected;

                    return CustomSelectableTile(
                      width: 80,
                      isActive: isActive,
                      onTap: () {
                        widget.onChoose(filteredOptions[index]);
                        context.pop();
                      },
                      title: widget.getName(option),
                      titleColor: Colors.black,
                      trailingWidget: widget.trailingWidget != null ? widget.trailingWidget!(option) : null,
                    );
                  },
                ),
        )
      ],
    );
  }
}
