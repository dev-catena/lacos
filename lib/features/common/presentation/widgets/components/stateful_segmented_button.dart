import 'package:flutter/material.dart';

class StatefulSegmentedButton<T> extends StatefulWidget {
  const StatefulSegmentedButton({
    required this.options,
    required this.getLabel,
    required this.getValue,
    required this.onChanged,
    this.multiSelect = false,
    this.initialSelection,
    super.key,
  });

  final List<T> options;
  final Set<T>? initialSelection;
  final bool multiSelect;
  final String Function(T value) getLabel;
  final T Function(T value) getValue;
  final void Function(Set<T> value) onChanged;

  @override
  State<StatefulSegmentedButton> createState() => _StatefulSegmentedButtonState<T>();
}

class _StatefulSegmentedButtonState<T> extends State<StatefulSegmentedButton<T>> {
  List<ButtonSegment<T>> segments = [];
  Set<T> selected = {};

  @override
  void initState() {
    super.initState();
    buildSegments();
  }

  @override
  void didUpdateWidget(covariant StatefulSegmentedButton<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.options != widget.options) {
      buildSegments();
    }
  }

  void buildSegments() {
    segments = widget.options
        .map((ele) => ButtonSegment<T>(
              value: widget.getValue(ele),
              label: Text(widget.getLabel(ele)),
            ))
        .toList();

    if(widget.initialSelection != null) {
      selected = widget.initialSelection!;
    } else {
      selected.add(segments.first.value);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<T>(
      segments: segments,
      showSelectedIcon: false,
      selected: selected,
      multiSelectionEnabled: widget.multiSelect,
      onSelectionChanged: (p0) {
        if(widget.multiSelect){
          selected = p0;
        } else {
          selected = {p0.first};
        }
        widget.onChanged(selected);

        setState(() {});
      },
    );
  }
}
