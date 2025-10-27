import 'dart:io';

import 'package:flutter/material.dart';
// import 'package:pdfx/pdfx.dart';

class FileInspector extends StatefulWidget {
  const FileInspector({super.key, required this.file});

  final File file;

  @override
  State<FileInspector> createState() => _FileInspectorState();
}

class _FileInspectorState extends State<FileInspector> {
  // PdfController? pdfController;

  @override
  void initState() {
    super.initState();
    _initFile();
  }

  Future<void> _initFile() async {
    final extension = widget.file.path.split('.').last.toLowerCase();

    // if (extension == 'pdf') {
    //   pdfController = PdfController(
    //     document: PdfDocument.openFile(widget.file.path),
    //   );
    //   setState(() {});
    // }
  }

  @override
  void dispose() {
    // pdfController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final extension = widget.file.path.split('.').last.toLowerCase();

    if (extension == 'pdf') {
      // if (pdfController == null) {
      //   return const Center(child: CircularProgressIndicator());
      // }
      return const SizedBox(
        height: 200,
        // child: PdfView(
        //   controller: pdfController!,
        //   pageSnapping: true,
        //   scrollDirection: Axis.vertical,
        // ),
      );
    } else {
      return Image.file(widget.file);
    }
  }
}