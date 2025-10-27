import 'dart:io';

import 'package:flutter/material.dart';
// import 'package:pdfx/pdfx.dart';

class FilePreview extends StatefulWidget {
  const FilePreview({super.key, required this.file});

  final File file;

  @override
  State<FilePreview> createState() => _FilePreviewState();
}

class _FilePreviewState extends State<FilePreview> {
  ImageProvider? previewImage;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    _loadPreview();
  }

  Future<void> _loadPreview() async {
    final extension = widget.file.path.split('.').last.toLowerCase();

    if (extension == 'pdf') {
      // final document = await PdfDocument.openFile(widget.file.path);
      // final page = await document.getPage(1);
      // final pageImage = await page.render(
      //   width: page.width,
      //   height: page.height,
      //   format: PdfPageImageFormat.png,
      // );
      // await page.close();

      // setState(() {ss
      //   previewImage = MemoryImage(pageImage!.bytes);
      //   loading = false;
      // });
    } else {
      setState(() {
        previewImage = FileImage(widget.file);
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (previewImage != null) {
      return Image(image: previewImage!);
    }

    return const Center(child: Text('Falha ao carregar prévia do arquivo!'));
  }
}
